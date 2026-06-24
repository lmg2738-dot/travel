import Link from "next/link";
import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--navy)] text-white/85">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Compass className="h-5 w-5 text-[var(--accent-on-dark)]" />
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                TripMind AI
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed">
              AI HUB 관광 데이터와 OpenRouter 무료 모델로
              <br />
              당신만의 여행을 설계합니다.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div>
              <p className="mb-3 font-medium text-white">메뉴</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/trips/new" className="text-white/80 hover:text-[var(--accent-on-dark)]">
                    새 여행
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-white/80 hover:text-[var(--accent-on-dark)]">
                    내 여행
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-medium text-white">기술</p>
              <ul className="space-y-2">
                <li>OpenRouter</li>
                <li>AI HUB</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/70 sm:flex-row">
          <p>© {new Date().getFullYear()} TripMind AI. All rights reserved.</p>
          <p>무료 AI · 로그인 불필요</p>
        </div>
      </div>
    </footer>
  );
}
