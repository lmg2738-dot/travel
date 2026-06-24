"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ChecklistItem } from "@/types/trip";
import { CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistProps {
  items: ChecklistItem[];
}

export function Checklist({ items }: ChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const totalItems = items.reduce((sum, g) => sum + g.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--navy)]/5">
              <CheckSquare className="h-5 w-5 text-[var(--accent-dark)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--navy)]">
                여행 체크리스트
              </h3>
              <p className="text-xs text-[var(--muted)]">
                {checkedCount} / {totalItems} 완료
              </p>
            </div>
          </div>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--navy)]/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-dark)] to-[var(--accent)] transition-all duration-300"
              style={{
                width: totalItems > 0 ? `${(checkedCount / totalItems) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {items.map((group, idx) => (
          <div key={idx}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--accent-dark)]">
              {group.category}
            </h4>
            <ul className="space-y-2">
              {group.items.map((item, i) => {
                const key = `${idx}-${i}`;
                const isChecked = checked[key];
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                        isChecked
                          ? "border-[var(--accent)]/30 bg-[var(--accent)]/5 text-[var(--muted)] line-through"
                          : "border-[var(--border)] bg-white hover:border-[var(--accent)]/30 hover:bg-[var(--background)]"
                      )}
                    >
                      {isChecked ? (
                        <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-dark)]" />
                      ) : (
                        <Square className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
                      )}
                      {item}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
