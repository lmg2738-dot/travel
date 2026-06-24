import { NextResponse } from "next/server";
import { z } from "zod";
import { generateItinerary } from "@/lib/ai/generate-itinerary";
import { createTrip } from "@/lib/db/trips";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  destination: z.string().min(1).max(100),
  days: z.number().int().min(1).max(30),
  budget: z.number().int().min(0).max(100_000_000),
  style: z.enum(["커플", "가족", "솔로", "친구", "비즈니스", "배낭여행"]),
  startDate: z.string().optional(),
});

function getMaxDays(): number {
  return process.env.VERCEL === "1" ? 7 : 30;
}

function mapGenerateError(error: unknown): { message: string; status: number } {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (error instanceof SyntaxError) {
    if (lower.includes("position 1") || lower.includes("line 1 column")) {
      return {
        message: "요청 형식이 올바르지 않습니다. 입력값을 확인해주세요.",
        status: 400,
      };
    }
    return {
      message: "AI 일정 형식 오류입니다. 일수를 줄여 다시 시도해주세요.",
      status: 502,
    };
  }

  if (message.includes("OPENROUTER_API_KEY")) {
    return {
      message: "OpenRouter API 키가 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.",
      status: 500,
    };
  }

  if (
    lower.includes("http 401") ||
    lower.includes("http 403") ||
    lower.includes("unauthorized")
  ) {
    return {
      message: "OpenRouter API 키가 유효하지 않습니다. Vercel 환경 변수를 확인하세요.",
      status: 500,
    };
  }

  if (
    lower.includes("http 402") ||
    lower.includes("credit") ||
    lower.includes("quota")
  ) {
    return {
      message: "OpenRouter 무료 사용 한도에 도달했습니다. 잠시 후 다시 시도해주세요.",
      status: 503,
    };
  }

  if (
    lower.includes("timeout") ||
    lower.includes("aborted") ||
    lower.includes("초과") ||
    lower.includes("모든 무료 모델") ||
    lower.includes("provider returned error") ||
    lower.includes("rate limit") ||
    lower.includes("free-models-per-day") ||
    lower.includes("http 429") ||
    lower.includes("http 500") ||
    lower.includes("http 502") ||
    lower.includes("http 503") ||
    lower.includes("openrouter api") ||
    lower.includes("비어 있습니다") ||
    lower.includes("호출에 실패")
  ) {
    return {
      message: "AI 서버가 일시적으로 불안정합니다. 1~2분 후 다시 시도해주세요.",
      status: 504,
    };
  }

  if (
    lower.includes("json으로 파싱") ||
    lower.includes("unexpected token") ||
    lower.includes("expected") ||
    lower.includes(" in json at position") ||
    lower.includes("after array element")
  ) {
    return {
      message: "AI 일정 형식 오류입니다. 일수를 줄여 다시 시도해주세요.",
      status: 502,
    };
  }

  if (
    lower.includes("모든 ai 모델") ||
    lower.includes("모든 무료 모델") ||
    lower.includes("불완전")
  ) {
    return {
      message: "AI 서버가 일시적으로 불안정합니다. 1~2분 후 다시 시도해주세요.",
      status: 503,
    };
  }

  if (lower.includes("사용 가능한 openrouter")) {
    return {
      message: "사용 가능한 AI 모델이 없습니다. 잠시 후 다시 시도해주세요.",
      status: 503,
    };
  }

  if (
    lower.includes("저장") ||
    lower.includes("enoent") ||
    lower.includes("eacces") ||
    lower.includes("ebusy")
  ) {
    return {
      message: "여행 데이터 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
      status: 500,
    };
  }

  return {
    message: "일정 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    status: 500,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 요청입니다.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { destination, days, budget, style, startDate } = parsed.data;
    const maxDays = getMaxDays();

    if (days > maxDays) {
      return NextResponse.json(
        {
          error: `Vercel 환경에서는 최대 ${maxDays}일까지 생성할 수 있습니다. 일수를 줄여주세요.`,
        },
        { status: 400 }
      );
    }

    const itinerary = await generateItinerary({
      destination,
      days,
      budget,
      style,
      startDate,
    });

    let start_date: string | null = null;
    let end_date: string | null = null;

    if (startDate) {
      start_date = startDate;
      const end = new Date(startDate);
      end.setDate(end.getDate() + days - 1);
      end_date = end.toISOString().split("T")[0];
    }

    const trip = await createTrip({
      destination,
      start_date,
      end_date,
      budget,
      style,
      itinerary,
    }).catch((saveError) => {
      console.error("Trip save error:", saveError);
      throw new Error("여행 데이터 저장에 실패했습니다.");
    });

    return NextResponse.json({ tripId: trip.id });
  } catch (error) {
    console.error("Generate trip error:", error);
    const mapped = mapGenerateError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
