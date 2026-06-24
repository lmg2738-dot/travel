import { NextResponse } from "next/server";
import { getAvailableFreeModels } from "@/lib/openrouter/models";

export async function GET() {
  try {
    const models = await getAvailableFreeModels();

    return NextResponse.json({
      count: models.length,
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        contextLength: m.context_length,
        pricing: m.pricing,
      })),
    });
  } catch (error) {
    console.error("OpenRouter models error:", error);
    return NextResponse.json(
      { error: "무료 모델 목록 조회에 실패했습니다." },
      { status: 502 }
    );
  }
}
