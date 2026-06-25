import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TripDetailContent } from "@/components/trips/trip-detail-content";
import { ShareButton } from "@/components/trips/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTripByShareToken } from "@/lib/db/trips";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BudgetBreakdown, ChecklistItem } from "@/types/trip";
import { MapPin, Calendar, Share2 } from "lucide-react";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps) {
  const { token } = await params;
  const trip = await getTripByShareToken(token);

  return {
    title: trip ? `${trip.destination} (공유)` : "공유된 여행",
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  if (!/^[a-f0-9]{32}$/.test(token)) {
    notFound();
  }

  const trip = await getTripByShareToken(token);

  if (!trip) {
    return (
      <div className="flex min-h-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="mb-6 text-[var(--muted)]">
            공유된 여행을 찾을 수 없습니다.
          </p>
          <Link href="/">
            <Button variant="gold">홈으로 돌아가기</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const days = trip.itineraries;
  const budget = trip.budget_breakdown as BudgetBreakdown | null;
  const checklist = (trip.checklist as ChecklistItem[]) ?? [];

  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <section className="section-hero relative overflow-hidden px-4 py-12 sm:px-6 sm:py-14">
        <div className="relative mx-auto max-w-4xl">
          <Badge className="mb-4 border-0 bg-white/15 text-[var(--accent-on-dark)] ring-white/25">
            <Share2 className="mr-1.5 h-3 w-3" />
            공유된 여행 일정
          </Badge>

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
            {trip.style && (
              <Badge className="border-0 bg-white/15 text-white/90 ring-white/25">
                {trip.style}
              </Badge>
            )}
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
