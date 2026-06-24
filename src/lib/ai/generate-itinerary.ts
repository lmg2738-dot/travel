import { z } from "zod";
import type { GeneratedItinerary, GenerateTripRequest } from "@/types/trip";
import { searchTourismDatasets, formatAihubContext } from "@/lib/aihub/tourism";
import { chatWithFreeModels } from "@/lib/openrouter/client";
import { parseAndValidateItinerary } from "@/lib/ai/parse-itinerary";

const AIHUB_CONTEXT_TIMEOUT_MS = 4_000;
const MAX_GENERATION_ATTEMPTS = 3;

const SYSTEM_PROMPT = `당신은 전문 여행 플래너 AI입니다.
반드시 아래 JSON 구조만 출력하세요. 설명 문장, 마크다운, 코드블록 없이 순수 JSON만 반환하세요.

{
  "summary": "여행 요약",
  "days": [
    {
      "dayNo": 1,
      "title": "Day 1 제목",
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

category는 attraction, restaurant, cafe, shopping, transport 중 하나만 사용하세요.`;

function buildUserPrompt(
  request: GenerateTripRequest,
  aihubContext: string
): string {
  return `다음 조건으로 ${request.days}일간의 여행 일정 JSON을 생성하세요.

목적지: ${request.destination}
예산: ${request.budget.toLocaleString()}원 (KRW)
여행 스타일: ${request.style}
${request.startDate ? `출발일: ${request.startDate}` : ""}
${aihubContext ? `\n참고 데이터 (AI HUB):\n${aihubContext}` : ""}

days 배열 길이는 정확히 ${request.days}개여야 합니다.
budget.total은 ${request.budget}원과 비슷해야 합니다.`;
}

function estimateMaxTokens(days: number): number {
  return Math.min(8192, Math.max(2500, days * 700));
}

async function loadAihubContext(destination: string): Promise<string> {
  try {
    const datasets = await Promise.race([
      searchTourismDatasets(destination),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), AIHUB_CONTEXT_TIMEOUT_MS)
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
  const aihubContext = await loadAihubContext(request.destination);
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserPrompt(request, aihubContext) },
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      const { content, model } = await chatWithFreeModels(messages, {
        jsonMode: true,
        maxTokens: estimateMaxTokens(request.days),
      });

      console.info(`[TripMind] 일정 생성 완료 (model: ${model})`);

      return parseAndValidateItinerary(content, request.budget);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      if (!isFormatError(err.message) || attempt === MAX_GENERATION_ATTEMPTS - 1) {
        throw err;
      }

      console.warn(
        `[TripMind] 일정 형식 오류, 다른 모델로 재시도 (${attempt + 1}/${MAX_GENERATION_ATTEMPTS})`
      );
    }
  }

  throw lastError ?? new Error("AI가 생성한 일정 형식이 올바르지 않습니다.");
}
