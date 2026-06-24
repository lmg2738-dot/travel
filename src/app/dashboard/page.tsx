import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listTripSummaries } from "@/lib/db/trips";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, MapPin, Calendar, ArrowRight, Compass } from "lucide-react";

export const metadata = {
  title: "내 여행",
};

export default async function DashboardPage() {
  const trips = await listTripSummaries();

  return (
    <PageShell>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent-dark)]">
            My Trips
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--navy)] sm:text-4xl">
            내 여행
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            {trips.length > 0
              ? `${trips.length}개의 여행 일정이 저장되어 있습니다`
              : "저장된 여행 일정이 없습니다"}
          </p>
        </div>
        <Link href="/trips/new">
          <Button variant="gold">
            <Plus className="h-4 w-4" />
            새 여행
          </Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="card-premium flex flex-col items-center px-6 py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--navy)]/5">
            <Compass className="h-10 w-10 text-[var(--accent-dark)]/70" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-[var(--navy)]">
            첫 여행을 계획해 보세요
          </h2>
          <p className="mb-8 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
            AI가 목적지에 맞는 일정, 맛집, 예산, 체크리스트를 자동으로 만들어 드립니다.
          </p>
          <Link href="/trips/new">
            <Button variant="gold" size="lg">
              <Plus className="h-4 w-4" />
              여행 시작하기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`} className="group">
              <article className="card-premium flex h-full flex-col overflow-hidden hover:-translate-y-1">
                <div className="h-1.5 bg-gradient-to-r from-[var(--accent-dark)] via-[var(--accent)] to-[var(--accent-light)]" />
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[var(--accent-dark)]" />
                      <h3 className="text-lg font-semibold text-[var(--navy)] group-hover:text-[var(--accent-dark)]">
                        {trip.destination}
                      </h3>
                    </div>
                    {trip.style && <Badge variant="gold">{trip.style}</Badge>}
                  </div>

                  {trip.summary && (
                    <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                      {trip.summary}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
                    <div className="flex flex-wrap gap-3">
                      {trip.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(trip.start_date)}
                        </span>
                      )}
                      <span className="font-medium text-[var(--navy)]">
                        {formatCurrency(trip.budget)}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
