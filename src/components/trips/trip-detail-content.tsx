import { ItineraryCard } from "@/components/trips/itinerary-card";
import { BudgetPlanner } from "@/components/trips/budget-planner";
import { Checklist } from "@/components/trips/checklist";
import { TripMap } from "@/components/trips/trip-map-dynamic";
import type { BudgetBreakdown, ChecklistItem, DayItinerary } from "@/types/trip";

interface TripDetailContentProps {
  destination: string;
  budget: number;
  days: DayItinerary[];
  budgetBreakdown: BudgetBreakdown | null;
  checklist: ChecklistItem[];
}

export function TripDetailContent({
  destination,
  budget,
  days,
  budgetBreakdown,
  checklist,
}: TripDetailContentProps) {
  return (
    <div className="space-y-8">
      {budgetBreakdown && (
        <BudgetPlanner budget={budgetBreakdown} totalBudget={budget} />
      )}

      <TripMap days={days} destination={destination} />

      <div>
        <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--navy)]">
          일별 상세 일정
        </h2>
        <div className="space-y-6">
          {days.map((day) => (
            <ItineraryCard key={day.dayNo} day={day} />
          ))}
        </div>
      </div>

      {checklist.length > 0 && <Checklist items={checklist} />}
    </div>
  );
}
