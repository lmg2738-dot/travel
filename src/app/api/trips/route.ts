import { NextResponse } from "next/server";
import { listTrips } from "@/lib/db/trips";

export async function GET() {
  const trips = await listTrips();
  return NextResponse.json({ trips });
}
