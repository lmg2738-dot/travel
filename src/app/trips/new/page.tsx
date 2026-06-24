import { PageShell } from "@/components/layout/page-shell";
import { TripForm } from "@/components/trips/trip-form";

export const metadata = {
  title: "새 여행",
};

export default function NewTripPage() {
  return (
    <PageShell className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-8 text-center sm:text-left">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent-dark)]">
          New Trip
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--navy)]">
          새 여행 계획
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          몇 가지 정보만 입력하면 AI가 맞춤 일정을 만들어 드립니다
        </p>
      </div>
      <TripForm />
    </PageShell>
  );
}
