import { NextResponse } from "next/server";
import { deleteTrip, getTripById } from "@/lib/db/trips";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trip = await getTripById(id);

  if (!trip) {
    return NextResponse.json({ error: "여행을 찾을 수 없습니다." }, { status: 404 });
  }

  const itineraries = trip.itineraries.map((content, index) => ({
    id: `${trip.id}-day-${content.dayNo}`,
    trip_id: trip.id,
    day_no: content.dayNo ?? index + 1,
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
      share_token: trip.share_token,
      summary: trip.summary,
      budget_breakdown: trip.budget_breakdown,
      checklist: trip.checklist,
      created_at: trip.created_at,
    },
    itineraries,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteTrip(id);

  if (!deleted) {
    return NextResponse.json({ error: "삭제 실패" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
