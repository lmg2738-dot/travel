"use client";

import dynamic from "next/dynamic";

export const TripMap = dynamic(
  () => import("./trip-map").then((m) => m.TripMap),
  {
    ssr: false,
    loading: () => (
      <div className="card-premium flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          지도 로딩 중...
        </div>
      </div>
    ),
  }
);
