import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TripDetailContent } from "@/components/trips/trip-detail-content";
import { ShareButton } from "@/components/trips/share-button";
import { Badge } from "@/components/ui/badge";
import type { StoredTrip } from "@/lib/db/trips";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BudgetBreakdown, ChecklistItem } from "@/types/trip";
import { MapPin, Calendar, ArrowLeft } from "lucide-react";

interface TripDetailViewProps {
  trip: StoredTrip;
}

export function TripDetailView({ trip }: TripDetailViewProps) {
  const days = trip.itineraries;
  const budget = trip.budget_breakdown as BudgetBreakdown | null;
  const checklist = (trip.checklist as ChecklistItem[]) ?? [];

  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <section className="section-hero relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm text-on-dark-subtle transition-colors hover:text-[var(--accent-on-dark)]"
          >
            <ArrowLeft className="h-4 w-4" />
            내 여행으로
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-white/15 text-[var(--accent-on-dark)] ring-white/25">
                  {days.length}일 일정
                </Badge>
                {trip.style && (
                  <Badge className="border-0 bg-white/15 text-white/90 ring-white/25">
                    {trip.style}
                  </Badge>
                )}
              </div>

              <div className="mb-3 flex items-center gap-3">
                <MapPin className="h-7 w-7 text-[var(--accent-on-dark)]" />
                <h1 className="hero-title font-[family-name:var(--font-display)] text-4xl font-semibold sm:text-5xl">
                  {trip.destination}
                </h1>
              </div>

              {trip.summary && (
                <p className="max-w-2xl text-base leading-relaxed text-on-dark-muted">
                  {trip.summary}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-on-dark-subtle">
                {trip.start_date && trip.end_date && (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[var(--accent-on-dark)]" />
                    {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                  </span>
                )}
                <span className="font-medium text-[var(--accent-on-dark)]">
                  {formatCurrency(trip.budget)}
                </span>
              </div>
            </div>

            <ShareButton shareToken={trip.share_token} />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <TripDetailContent
          destination={trip.destination}
          budget={trip.budget}
          days={days}
          budgetBreakdown={budget}
          checklist={checklist}
        />
      </main>

      <Footer />
    </div>
  );
}
