import { TripDetailView } from "@/components/trips/trip-detail-view";
import { TripDetailClientLoader } from "@/components/trips/trip-detail-client-loader";
import { getCachedTripById } from "@/lib/db/trip-cache";
import { isVercelRuntime } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

interface TripDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TripDetailPageProps) {
  const { id } = await params;

  if (isVercelRuntime()) {
    return { title: "여행 상세" };
  }

  const trip = await getCachedTripById(id);
  return {
    title: trip ? trip.destination : "여행 상세",
  };
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = await params;

  if (isVercelRuntime()) {
    return <TripDetailClientLoader tripId={id} />;
  }

  const trip = await getCachedTripById(id);

  if (trip) {
    return <TripDetailView trip={trip} />;
  }

  return <TripDetailClientLoader tripId={id} />;
}
