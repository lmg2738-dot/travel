import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--navy)]/5">
          <Compass className="h-10 w-10 text-[var(--accent-dark)]/40" />
        </div>
        <p className="mb-2 font-[family-name:var(--font-display)] text-6xl font-semibold text-[var(--navy)]/35">
          404
        </p>
        <h1 className="mb-3 text-xl font-semibold text-[var(--navy)]">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mb-8 max-w-sm text-sm text-[var(--muted)]">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="outline">홈으로</Button>
          </Link>
          <Link href="/trips/new">
            <Button variant="gold">새 여행 만들기</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
