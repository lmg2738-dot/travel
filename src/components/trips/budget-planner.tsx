import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { BudgetBreakdown } from "@/types/trip";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";

interface BudgetPlannerProps {
  budget: BudgetBreakdown;
  totalBudget?: number;
}

const categories = [
  { key: "accommodation" as const, label: "숙박", color: "#b8956a" },
  { key: "food" as const, label: "식비", color: "#c9a227" },
  { key: "transport" as const, label: "교통", color: "#64748b" },
  { key: "activities" as const, label: "활동", color: "#0c1222" },
  { key: "shopping" as const, label: "쇼핑", color: "#9a7b4f" },
  { key: "contingency" as const, label: "예비비", color: "#94a3b8" },
];

export function BudgetPlanner({ budget, totalBudget }: BudgetPlannerProps) {
  const total = budget.total || totalBudget || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <Wallet className="h-5 w-5 text-[var(--accent-dark)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--navy)]">
                예산 플래너
              </h3>
              <p className="text-xs text-[var(--muted)]">카테고리별 배분</p>
            </div>
          </div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--navy)]">
            {formatCurrency(total)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex h-3 overflow-hidden rounded-full bg-[var(--navy)]/5">
          {categories.map((cat) => {
            const amount = budget[cat.key];
            const pct = total > 0 ? (amount / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={cat.key}
                className="transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: cat.color }}
                title={`${cat.label}: ${formatCurrency(amount)}`}
              />
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((cat) => {
            const amount = budget[cat.key];
            const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
            return (
              <div
                key={cat.key}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-[var(--muted)]">{cat.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--navy)]">
                    {formatCurrency(amount)}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
