import { NextResponse } from "next/server";
import { getTripByShareToken } from "@/lib/db/trips";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!/^[a-f0-9]{32}$/.test(token)) {
    return NextResponse.json(
      { error: "유효하지 않은 공유 링크입니다." },
      { status: 400 }
    );
  }

  const trip = await getTripByShareToken(token);

  if (!trip) {
    return NextResponse.json(
      { error: "공유된 여행을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const itineraries = trip.itineraries.map((content) => ({
    id: `${trip.id}-day-${content.dayNo}`,
    trip_id: trip.id,
    day_no: content.dayNo,
    content,
  }));

  return NextResponse.json({
    trip: {
      id: trip.id,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      budget: trip.budget,
      style: trip.style,
      summary: trip.summary,
      budget_breakdown: trip.budget_breakdown,
      checklist: trip.checklist,
      share_token: trip.share_token,
      created_at: trip.created_at,
    },
    itineraries,
  });
}
