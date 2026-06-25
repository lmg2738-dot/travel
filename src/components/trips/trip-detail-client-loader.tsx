"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import type { StoredTrip } from "@/lib/db/trips";
import {
  loadTripFromClientCache,
  saveTripToClientCache,
} from "@/lib/trip-client-cache";
import { TripDetailView } from "@/components/trips/trip-detail-view";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TripDetailClientLoaderProps {
  tripId: string;
}

function mapApiTrip(data: {
  trip: {
    id: string;
    destination: string;
    start_date: string | null;
    end_date: string | null;
    budget: number;
    style: string | null;
    share_token: string;
    summary: string | null;
    budget_breakdown: StoredTrip["budget_breakdown"];
    checklist: StoredTrip["checklist"];
    created_at: string;
  };
  itineraries: Array<{ content: StoredTrip["itineraries"][number] }>;
}): StoredTrip {
  return {
    id: data.trip.id,
    destination: data.trip.destination,
    start_date: data.trip.start_date,
    end_date: data.trip.end_date,
    budget: data.trip.budget,
    style: data.trip.style,
    share_token: data.trip.share_token,
    summary: data.trip.summary,
    budget_breakdown: data.trip.budget_breakdown,
    checklist: data.trip.checklist,
    itineraries: data.itineraries.map((item) => item.content),
    created_at: data.trip.created_at,
  };
}

async function fetchTripFromApi(tripId: string): Promise<StoredTrip | null> {
  const response = await fetch(`/api/trips/${tripId}`, { cache: "no-store" });
  if (!response.ok) return null;
  const data = await response.json();
  return mapApiTrip(data);
}

export function TripDetailClientLoader({ tripId }: TripDetailClientLoaderProps) {
  const [trip, setTrip] = useState<StoredTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useLayoutEffect(() => {
    const cached = loadTripFromClientCache(tripId);
    if (cached) {
      setTrip(cached);
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (trip) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTrip() {
      for (let attempt = 0; attempt < 3; attempt++) {
        const cached = loadTripFromClientCache(tripId);
        if (cached) {
          if (!cancelled) {
            setTrip(cached);
            setLoading(false);
          }
          return;
        }

        const loaded = await fetchTripFromApi(tripId);
        if (loaded) {
          saveTripToClientCache(loaded);
          if (!cancelled) {
            setTrip(loaded);
            setLoading(false);
          }
          return;
        }

        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        }
      }

      if (!cancelled) {
        setMissing(true);
        setLoading(false);
      }
    }

    void loadTrip();

    return () => {
      cancelled = true;
    };
  }, [tripId, trip]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (trip) {
    return <TripDetailView trip={trip} />;
  }

  if (missing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="mb-2 text-lg font-semibold text-[var(--navy)]">
          여행 일정을 불러올 수 없습니다
        </p>
        <p className="mb-8 max-w-md text-sm text-[var(--muted)]">
          Vercel 배포 환경에서는 Blob Storage 설정 전까지 브라우저 캐시에만
          저장됩니다. 새로고침·다른 기기에서는 표시되지 않을 수 있습니다.
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard">
            <Button variant="outline">대시보드</Button>
          </Link>
          <Link href="/trips/new">
            <Button variant="gold">새 여행 만들기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
