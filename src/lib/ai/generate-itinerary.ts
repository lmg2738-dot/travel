import type { GeneratedItinerary, GenerateTripRequest } from "@/types/trip";
import { searchTourismDatasets, formatAihubContext } from "@/lib/aihub/tourism";
import { chatWithModel } from "@/lib/openrouter/client";
import {
  markModelUnavailable,
  isModelUnavailableError,
  isOpenRouterQuotaExhausted,
  OPENROUTER_QUOTA_USER_MESSAGE,
  isOpenRouterRateLimited,
  rememberSuccessfulModel,
  resolvePreferredFreeModelIds,
  PREFERRED_FREE_MODEL_IDS,
} from "@/lib/openrouter/models";
import { parseAndValidateItinerary } from "@/lib/ai/parse-itinerary";
import { getGenerateRuntimeConfig, isVercelRuntime } from "@/lib/runtime-config";

const SYSTEM_PROMPT = `당신은 전문 여행 플래너 AI입니다.
반드시 완전한 JSON만 출력하세요. 마크다운, 설명, 코드블록, 줄임표(...) 금지.

출력 형식 예시:
{"summary":"3일 서울 여행","days":[{"dayNo":1,"title":"첫날","places":[{"name":"경복궁","description":"조선 궁궐","category":"attraction","lat":37.5796,"lng":126.9770},{"name":"인사동","description":"전통 거리","category":"attraction"}],"dailyBudget":80000,"tips":["편한 신발"]},{"dayNo":2,"title":"둘째날","places":[{"name":"남산타워","description":"전망대","category":"attraction"}],"dailyBudget":70000,"tips":[]}],"budget":{"accommodation":200000,"food":150000,"transport":50000,"activities":80000,"shopping":50000,"contingency":70000,"total":600000},"checklist":[{"category":"준비물","items":["신분증"]}]}

규칙:
- summary, days, budget, checklist 필드 필수
- days 배열 길이는 요청 일수와 정확히 동일
- 하루 places는 2~3개 (짧은 description)
- category: attraction|restaurant|cafe|shopping|transport
- lat/lng는 실제 좌표 숫자`;

const VERCEL_SYSTEM_PROMPT = `전문 여행 플래너. 완전한 JSON만 출력(마크다운/코드블록/... 금지).
필수: summary, days(요청 일수와 동일), budget, checklist
하루 places 2개, category: attraction|restaurant|cafe|shopping|transport
예: {"summary":"3일 여행","days":[{"dayNo":1,"title":"Day1","places":[{"name":"장소","description":"설명","category":"attraction"}],"dailyBudget":50000,"tips":[]}],"budget":{"accommodation":100000,"food":80000,"transport":30000,"activities":50000,"shopping":30000,"contingency":20000,"total":310000},"checklist":[{"category":"준비물","items":["신분증"]}]}`;

function getSystemPrompt(): string {
  return isVercelRuntime() ? VERCEL_SYSTEM_PROMPT : SYSTEM_PROMPT;
}

function buildUserPrompt(
  request: GenerateTripRequest,
  aihubContext: string
): string {
  if (isVercelRuntime()) {
    return `목적지:${request.destination}, ${request.days}일, 예산:${request.budget}원, 스타일:${request.style}
days ${request.days}개, 각 day places 2개, JSON만 출력`;
  }

  return `목적지: ${request.destination}
일수: ${request.days}일
예산: ${request.budget.toLocaleString()}원
스타일: ${request.style}
${request.startDate ? `출발일: ${request.startDate}` : ""}
${aihubContext ? `\n참고:\n${aihubContext}` : ""}

days 배열은 반드시 ${request.days}개 요소를 포함해야 합니다.
각 day의 places는 2~3개로 간결하게 작성하세요.`;
}

function estimateMaxTokens(days: number, cap: number): number {
  const perDay = isVercelRuntime() ? 550 : 750;
  const floor = isVercelRuntime() ? 1800 : 2400;
  return Math.min(cap, Math.max(floor, days * perDay));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getModelTimeoutMs(
  modelTry: number,
  remainingMs: number,
  baseTimeoutMs: number
): number {
  const reserveMs = modelTry === 0 ? 5_000 : 2_500;
  const cap =
    modelTry === 0
      ? baseTimeoutMs
      : modelTry < 3
        ? 12_000
        : 9_000;
  return Math.max(6_000, Math.min(cap, remainingMs - reserveMs));
}

async function loadAihubContext(
  destination: string,
  skipAihub: boolean,
  timeoutMs: number
): Promise<string> {
  if (skipAihub || timeoutMs <= 0) return "";

  try {
    const datasets = await Promise.race([
      searchTourismDatasets(destination),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), timeoutMs)
      ),
    ]);

    if (!datasets || datasets.length === 0) return "";
    return formatAihubContext(datasets);
  } catch (error) {
    console.warn("[TripMind] AI HUB 컨텍스트 로드 생략:", error);
    return "";
  }
}

function isFormatError(error: unknown): boolean {
  if (error instanceof SyntaxError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("JSON") ||
    message.includes("파싱") ||
    message.includes("Unexpected token") ||
    message.includes("Expected") ||
    message.includes("after array element")
  );
}

function isRetryableError(message: string): boolean {
  return isModelUnavailableError(0, message);
}

export async function generateItinerary(
  request: GenerateTripRequest
): Promise<GeneratedItinerary> {
  const runtime = getGenerateRuntimeConfig();
  const startedAt = Date.now();
  const excludedModels = new Set<string>();

  const aihubContext = await loadAihubContext(
    request.destination,
    runtime.skipAihub,
    runtime.skipAihub ? 0 : 2_000
  );

  const messages = [
    { role: "system" as const, content: getSystemPrompt() },
    { role: "user" as const, content: buildUserPrompt(request, aihubContext) },
  ];

  let lastError: Error | null = null;
  let quotaHits = 0;
  const maxModelTries = runtime.maxModelAttempts;

  for (let attempt = 0; attempt < runtime.maxGenerationAttempts; attempt++) {
    for (let modelTry = 0; modelTry < maxModelTries; modelTry++) {
      const elapsed = Date.now() - startedAt;
      const remaining = runtime.totalBudgetMs - elapsed;

      if (remaining < 6_000) break;

      const modelIds = await resolvePreferredFreeModelIds(
        PREFERRED_FREE_MODEL_IDS,
        1,
        [...excludedModels]
      );
      const modelId = modelIds[0];
      if (!modelId) break;

      const timeoutMs = getModelTimeoutMs(
        modelTry,
        remaining,
        runtime.openRouterTimeoutMs
      );

      try {
        const { content, model } = await chatWithModel(modelId, messages, {
          jsonMode: false,
          maxTokens: estimateMaxTokens(request.days, runtime.maxTokensCap),
          timeoutMs,
        });

        const itinerary = parseAndValidateItinerary(
          content,
          request.budget,
          request.days
        );

        rememberSuccessfulModel(model);
        console.info(
          `[TripMind] 일정 생성 완료 (model: ${model}, ${Date.now() - startedAt}ms)`
        );

        return itinerary;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        lastError = err;
        excludedModels.add(modelId);

        if (isOpenRouterQuotaExhausted(err.message)) {
          quotaHits += 1;
          console.warn(
            `[TripMind] 모델 ${modelId} 일일 한도, 다음 모델 시도: ${err.message}`
          );
          continue;
        }

        if (isFormatError(error) || isRetryableError(err.message)) {
          markModelUnavailable(modelId);
          console.warn(
            `[TripMind] 모델 ${modelId} 실패, 다음 모델 시도: ${err.message}`
          );
          if (isOpenRouterRateLimited(err.message)) {
            await sleep(modelTry < 2 ? 1_200 : 2_000);
          }
          continue;
        }

        throw err;
      }
    }

    if (attempt < runtime.maxGenerationAttempts - 1) {
      messages.push({
        role: "user",
        content: `이전 응답이 잘못되었습니다. days 배열을 정확히 ${request.days}개 포함한 완전한 JSON만 다시 출력하세요.`,
      });
    }
  }

  if (
    quotaHits > 0 &&
    (isOpenRouterQuotaExhausted(lastError?.message ?? "") ||
      quotaHits >= Math.max(2, Math.ceil(maxModelTries / 2)))
  ) {
    throw new Error(OPENROUTER_QUOTA_USER_MESSAGE);
  }

  throw (
    lastError instanceof SyntaxError
      ? new Error(
          "AI가 생성한 일정 JSON 파싱에 실패했습니다. 일수를 줄여 다시 시도해주세요."
        )
      : lastError ??
          new Error(
            "모든 AI 모델에서 일정 생성에 실패했습니다. 잠시 후 다시 시도해주세요."
          )
  );
}
