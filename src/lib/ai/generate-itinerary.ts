import type { GeneratedItinerary, GenerateTripRequest } from "@/types/trip";
import { searchTourismDatasets, formatAihubContext } from "@/lib/aihub/tourism";
import { chatWithFreeModels } from "@/lib/openrouter/client";
import { markModelUnavailable } from "@/lib/openrouter/models";
import { parseAndValidateItinerary } from "@/lib/ai/parse-itinerary";
import { getGenerateRuntimeConfig } from "@/lib/runtime-config";

const SYSTEM_PROMPT = `당신은 전문 여행 플래너 AI입니다.
반드시 완전한 JSON만 출력하세요. 마크다운, 설명, 코드블록, 줄임표(...) 금지.

출력 형식 예시:
{"summary":"3일 서울 여행","days":[{"dayNo":1,"title":"첫날","places":[{"name":"경복궁","description":"조선 궁궐","category":"attraction","lat":37.5796,"lng":126.9770}],"dailyBudget":80000,"tips":["편한 신발"]}],"budget":{"accommodation":200000,"food":150000,"transport":50000,"activities":80000,"shopping":50000,"contingency":70000,"total":600000},"checklist":[{"category":"준비물","items":["여권"]}]}

규칙:
- summary, days, budget, checklist 필드 필수
- days 배열 길이는 요청 일수와 동일
- 하루 places는 2~3개만 (짧은 description)
- category: attraction|restaurant|cafe|shopping|transport
- lat/lng는 실제 좌표 숫자`;

function buildUserPrompt(
  request: GenerateTripRequest,
  aihubContext: string
): string {
  return `목적지: ${request.destination}
일수: ${request.days}일
예산: ${request.budget.toLocaleString()}원
스타일: ${request.style}
${request.startDate ? `출발일: ${request.startDate}` : ""}
${aihubContext ? `\n참고:\n${aihubContext}` : ""}

days는 ${request.days}개, 각 day places는 2~3개로 간결하게 작성하세요.`;
}

function estimateMaxTokens(days: number, cap: number): number {
  return Math.min(cap, Math.max(2000, days * 550));
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

function isFormatError(message: string): boolean {
  return (
    message.includes("JSON") ||
    message.includes("형식") ||
    message.includes("파싱") ||
    message.includes("SyntaxError") ||
    message.includes("Unexpected token")
  );
}

export async function generateItinerary(
  request: GenerateTripRequest
): Promise<GeneratedItinerary> {
  const runtime = getGenerateRuntimeConfig();
  const startedAt = Date.now();
  const excludedModels: string[] = [];

  const aihubContext = await loadAihubContext(
    request.destination,
    runtime.skipAihub,
    runtime.skipAihub ? 0 : 2_000
  );

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserPrompt(request, aihubContext) },
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < runtime.maxGenerationAttempts; attempt++) {
    const elapsed = Date.now() - startedAt;
    const remaining = runtime.totalBudgetMs - elapsed;

    if (remaining < 8_000) {
      throw new Error(
        "AI 응답 시간이 초과되었습니다. 일수를 줄이거나 잠시 후 다시 시도해주세요."
      );
    }

    let usedModel = "";

    try {
      const { content, model } = await chatWithFreeModels(messages, {
        jsonMode: true,
        maxTokens: estimateMaxTokens(request.days, runtime.maxTokensCap),
        timeoutMs: Math.min(runtime.openRouterTimeoutMs, remaining - 2_000),
        maxModelAttempts: runtime.maxModelAttempts,
        excludeModelIds: excludedModels,
      });

      usedModel = model;
      console.info(
        `[TripMind] 일정 생성 완료 (model: ${model}, ${Date.now() - startedAt}ms)`
      );

      return parseAndValidateItinerary(content, request.budget);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      if (usedModel) {
        excludedModels.push(usedModel);
        markModelUnavailable(usedModel);
      }

      if (
        !isFormatError(err.message) ||
        attempt === runtime.maxGenerationAttempts - 1
      ) {
        throw err;
      }

      console.warn(
        `[TripMind] 일정 형식 오류, 다른 모델로 재시도 (${attempt + 1}/${runtime.maxGenerationAttempts})`
      );

      messages.push({
        role: "user",
        content:
          "이전 응답이 잘못된 JSON이었습니다. 위 예시 형식과 동일한 완전한 JSON만 다시 출력하세요.",
      });
    }
  }

  throw lastError ?? new Error("AI가 생성한 일정 형식이 올바르지 않습니다.");
}
