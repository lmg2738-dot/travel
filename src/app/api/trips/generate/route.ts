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
    });

    return NextResponse.json({ tripId: trip.id });
  } catch (error) {
    console.error("Generate trip error:", error);

    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("OPENROUTER_API_KEY")) {
      return NextResponse.json(
        { error: "OpenRouter API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    if (
      message.includes("OpenRouter API 오류: HTTP 401") ||
      message.includes("OpenRouter API 오류: HTTP 403")
    ) {
      return NextResponse.json(
        { error: "OpenRouter API 키가 유효하지 않습니다. Vercel 환경 변수를 확인하세요." },
        { status: 500 }
      );
    }

    if (
      message.includes("timeout") ||
      message.includes("aborted") ||
      message.includes("초과") ||
      message.includes("모든 무료 모델")
    ) {
      return NextResponse.json(
        {
          error:
            "AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 504 }
      );
    }

    if (
      message.includes("JSON") ||
      message.includes("형식") ||
      message.includes("파싱") ||
      message.includes("SyntaxError") ||
      message.includes("Unexpected token")
    ) {
      return NextResponse.json(
        { error: "AI 일정 형식 오류입니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "일정 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
