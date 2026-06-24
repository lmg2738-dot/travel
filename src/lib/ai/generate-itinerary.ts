import type { GeneratedItinerary, GenerateTripRequest } from "@/types/trip";
import { searchTourismDatasets, formatAihubContext } from "@/lib/aihub/tourism";
import { chatWithFreeModels } from "@/lib/openrouter/client";
import { parseAndValidateItinerary } from "@/lib/ai/parse-itinerary";
import { getGenerateRuntimeConfig } from "@/lib/runtime-config";

const SYSTEM_PROMPT = `당신은 전문 여행 플래너 AI입니다.
반드시 아래 JSON 구조만 출력하세요. 설명, 마크다운, 코드블록 없이 순수 JSON만 반환하세요.

{
  "summary": "여행 요약",
  "days": [
    {
      "dayNo": 1,
      "title": "Day 1",
      "places": [
        {
          "name": "장소명",
          "description": "설명",
          "address": "주소",
          "lat": 37.5,
          "lng": 127.0,
          "estimatedCost": 10000,
          "category": "attraction"
        }
      ],
      "dailyBudget": 100000,
      "tips": ["팁"]
    }
  ],
  "budget": {
    "accommodation": 0,
    "food": 0,
    "transport": 0,
    "activities": 0,
    "shopping": 0,
    "contingency": 0,
    "total": 0
  },
  "checklist": [{ "category": "준비물", "items": ["여권"] }]
}

category: attraction|restaurant|cafe|shopping|transport`;

function buildUserPrompt(
  request: GenerateTripRequest,
  aihubContext: string
): string {
  return `목적지: ${request.destination}
일수: ${request.days}일 (days 배열 ${request.days}개)
예산: ${request.budget.toLocaleString()}원
스타일: ${request.style}
${request.startDate ? `출발일: ${request.startDate}` : ""}
${aihubContext ? `\n참고:\n${aihubContext}` : ""}`;
}

function estimateMaxTokens(days: number, cap: number): number {
  return Math.min(cap, Math.max(1800, days * 450));
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
    message.includes("파싱")
  );
}

export async function generateItinerary(
  request: GenerateTripRequest
): Promise<GeneratedItinerary> {
  const runtime = getGenerateRuntimeConfig();
  const startedAt = Date.now();

  const aihubContext = await loadAihubContext(
    request.destination,
    runtime.skipAihub,
    runtime.skipAihub ? 0 : 3_000
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

    try {
      const { content, model } = await chatWithFreeModels(messages, {
        jsonMode: true,
        maxTokens: estimateMaxTokens(request.days, runtime.maxTokensCap),
        timeoutMs: Math.min(runtime.openRouterTimeoutMs, remaining - 2_000),
        maxModelAttempts: runtime.maxModelAttempts,
      });

      console.info(`[TripMind] 일정 생성 완료 (model: ${model}, ${Date.now() - startedAt}ms)`);

      return parseAndValidateItinerary(content, request.budget);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      if (
        !isFormatError(err.message) ||
        attempt === runtime.maxGenerationAttempts - 1
      ) {
        throw err;
      }

      console.warn(
        `[TripMind] 일정 형식 오류, 재시도 (${attempt + 1}/${runtime.maxGenerationAttempts})`
      );
    }
  }

  throw lastError ?? new Error("AI가 생성한 일정 형식이 올바르지 않습니다.");
}
