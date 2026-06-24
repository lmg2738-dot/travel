import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DayItinerary } from "@/types/trip";
import { formatCurrency } from "@/lib/utils";
import {
  MapPin,
  Utensils,
  Coffee,
  ShoppingBag,
  Bus,
  Landmark,
  Lightbulb,
} from "lucide-react";

const categoryIcons = {
  attraction: Landmark,
  restaurant: Utensils,
  cafe: Coffee,
  shopping: ShoppingBag,
  transport: Bus,
};

const categoryLabels = {
  attraction: "관광지",
  restaurant: "맛집",
  cafe: "카페",
  shopping: "쇼핑",
  transport: "이동",
};

const categoryColors = {
  attraction: "bg-amber-50 text-amber-700 ring-amber-200/50",
  restaurant: "bg-rose-50 text-rose-700 ring-rose-200/50",
  cafe: "bg-orange-50 text-orange-700 ring-orange-200/50",
  shopping: "bg-purple-50 text-purple-700 ring-purple-200/50",
  transport: "bg-sky-50 text-sky-700 ring-sky-200/50",
};

interface ItineraryCardProps {
  day: DayItinerary;
}

export function ItineraryCard({ day }: ItineraryCardProps) {
  return (
    <Card>
      <CardHeader className="bg-[var(--background)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy)] font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--accent-on-dark)]">
              {day.dayNo}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                Day {day.dayNo}
              </p>
              <h3 className="text-xl font-semibold text-[var(--navy)]">
                {day.title}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--accent-dark)] ring-1 ring-[var(--accent)]/20">
            {formatCurrency(day.dailyBudget)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-0 p-0">
        <div className="relative px-6 py-2 sm:px-8">
          <div className="absolute left-[2.65rem] top-0 h-full w-px bg-gradient-to-b from-[var(--accent)]/40 via-[var(--border)] to-transparent sm:left-[3.15rem]" />

          {day.places.map((place, idx) => {
            const Icon = categoryIcons[place.category];
            return (
              <div key={idx} className="relative flex gap-4 py-5 sm:gap-5">
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-4 ring-[var(--background)] sm:h-11 sm:w-11">
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-[var(--navy)]/5">
                    <Icon className="h-4 w-4 text-[var(--accent-dark)]" />
                  </div>
                </div>

                <div className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md sm:p-5">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[var(--navy)]">
                        {place.name}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${categoryColors[place.category]}`}
                      >
                        {categoryLabels[place.category]}
                      </span>
                    </div>
                    {place.estimatedCost != null && (
                      <span className="shrink-0 text-sm font-medium text-[var(--muted)]">
                        {formatCurrency(place.estimatedCost)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">
                    {place.description}
                  </p>
                  {place.address && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-[var(--muted)]">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      {place.address}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {day.tips.length > 0 && (
          <div className="mx-6 mb-6 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-5 sm:mx-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--accent-dark)]">
              <Lightbulb className="h-4 w-4" />
              여행 팁
            </div>
            <ul className="space-y-2">
              {day.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm leading-relaxed text-[var(--navy)]/80"
                >
                  <span className="text-[var(--accent)]">·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
