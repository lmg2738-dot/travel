import { NextResponse } from "next/server";
import { listTrips, saveTrip } from "@/lib/db/trips";
import { storedTripSchema } from "@/lib/db/trip-schema";

export async function GET() {
  const trips = await listTrips();
  return NextResponse.json({ trips });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = storedTripSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "잘못된 여행 데이터입니다." },
        { status: 400 }
      );
    }

    const trip = await saveTrip(parsed.data);
    return NextResponse.json({ tripId: trip.id });
  } catch (error) {
    console.error("Trip upsert error:", error);
    return NextResponse.json(
      { error: "여행 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
