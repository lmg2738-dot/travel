"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TravelStyle } from "@/types/trip";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Sparkles,
  MapPin,
  CalendarDays,
  Wallet,
  Users,
  Loader2,
} from "lucide-react";

const STYLE_OPTIONS: { value: TravelStyle; label: string; emoji: string }[] = [
  { value: "커플", label: "커플", emoji: "💑" },
  { value: "가족", label: "가족", emoji: "👨‍👩‍👧" },
  { value: "솔로", label: "솔로", emoji: "🎒" },
  { value: "친구", label: "친구", emoji: "👯" },
  { value: "비즈니스", label: "비즈니스", emoji: "💼" },
  { value: "배낭여행", label: "배낭여행", emoji: "🏕️" },
];

const BUDGET_PRESETS = [
  { label: "50만", value: 500_000 },
  { label: "100만", value: 1_000_000 },
  { label: "200만", value: 2_000_000 },
  { label: "500만", value: 5_000_000 },
];

export function TripForm() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(4);
  const [budget, setBudget] = useState(1_000_000);
  const [style, setStyle] = useState<TravelStyle>("커플");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days,
          budget,
          style,
          startDate: startDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "일정 생성에 실패했습니다.");
        setLoading(false);
        return;
      }

      router.push(`/trips/${data.tripId}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-br from-[var(--navy)] to-[var(--navy-soft)] text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge className="mb-3 border-0 bg-white/15 text-[var(--accent-on-dark)] ring-white/25">
              AI Planner
            </Badge>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
              여행 일정 만들기
            </h2>
            <p className="mt-2 text-sm text-on-dark-muted">
              아래 정보를 입력하면 AI가 맞춤 일정을 생성합니다
            </p>
          </div>
          <Sparkles className="hidden h-8 w-8 shrink-0 text-[var(--accent-on-dark)]/70 sm:block" />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 목적지 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--navy)]">
              <MapPin className="h-4 w-4 text-[var(--accent-dark)]" />
              어디로 떠나시나요?
            </div>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="예: 오사카, 제주도, 파리, 방콕"
              required
              maxLength={100}
              hint="도시 또는 지역명을 입력하세요"
            />
          </section>

          {/* 일수 & 출발일 */}
          <section className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--navy)]">
                <CalendarDays className="h-4 w-4 text-[var(--accent-dark)]" />
                여행 일수
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDays(Math.max(1, days - 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-white text-lg font-medium transition-colors hover:border-[var(--accent)]"
                  aria-label="일수 줄이기"
                >
                  −
                </button>
                <div className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--background)] font-semibold text-[var(--navy)]">
                  {days}일
                </div>
                <button
                  type="button"
                  onClick={() => setDays(Math.min(30, days + 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-white text-lg font-medium transition-colors hover:border-[var(--accent)]"
                  aria-label="일수 늘리기"
                >
                  +
                </button>
              </div>
            </div>

            <Input
              label="출발일 (선택)"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              hint="입력 시 날짜별 일정이 생성됩니다"
            />
          </section>

          {/* 예산 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--navy)]">
                <Wallet className="h-4 w-4 text-[var(--accent-dark)]" />
                예산
              </div>
              <span className="text-sm font-semibold text-[var(--accent-dark)]">
                {formatCurrency(budget)}
              </span>
            </div>
            <input
              type="range"
              min={100000}
              max={10000000}
              step={100000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--navy)]/10 accent-[var(--accent-dark)]"
            />
            <div className="flex flex-wrap gap-2">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setBudget(preset.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                    budget === preset.value
                      ? "bg-[var(--navy)] text-white"
                      : "bg-black/[0.04] text-[var(--muted)] hover:bg-black/[0.08]"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          {/* 스타일 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--navy)]">
              <Users className="h-4 w-4 text-[var(--accent-dark)]" />
              여행 스타일
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStyle(opt.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                    style === opt.value
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--navy)] shadow-sm ring-1 ring-[var(--accent)]/30"
                      : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--border-strong)]"
                  )}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="gold"
            size="lg"
            loading={loading}
            className="w-full"
            disabled={!destination.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                AI가 일정을 생성하고 있습니다...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                AI 일정 생성하기
              </>
            )}
          </Button>

          <p className="text-center text-xs text-[var(--muted)]">
            생성에는 약 30초~1분이 소요될 수 있습니다
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
