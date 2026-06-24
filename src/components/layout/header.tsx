"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Compass, Menu, X } from "lucide-react";

const navItems = [
  { href: "/trips/new", label: "새 여행" },
  { href: "/dashboard", label: "내 여행" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[4.5rem] sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--navy)] shadow-md transition-transform group-hover:scale-105">
            <Compass className="h-5 w-5 text-[var(--accent-on-dark)]" />
          </div>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--navy)]">
              TripMind
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] sm:block">
              AI Travel Studio
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-[var(--navy)]/5 text-[var(--navy)]"
                  : "text-[var(--muted)] hover:bg-black/[0.03] hover:text-[var(--foreground)]"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/trips/new" className="ml-2">
            <Button variant="gold" size="sm">
              여행 시작
            </Button>
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {mobileOpen ? (
            <X className="h-5 w-5 text-[var(--navy)]" />
          ) : (
            <Menu className="h-5 w-5 text-[var(--navy)]" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-white/95 px-4 py-4 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm font-medium",
                  pathname === item.href
                    ? "bg-[var(--navy)]/5 text-[var(--navy)]"
                    : "text-[var(--muted)]"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/trips/new" onClick={() => setMobileOpen(false)} className="mt-2">
              <Button variant="gold" className="w-full">
                여행 시작
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
