import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  MapPin,
  Wallet,
  Share2,
  Database,
  ArrowRight,
  Clock,
  Shield,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: Sparkles,
      title: "AI 맞춤 일정",
      description:
        "목적지·예산·스타일만 입력하면 일정, 맛집, 동선까지 한 번에 생성합니다.",
    },
    {
      icon: Wallet,
      title: "스마트 예산",
      description:
        "숙박, 식비, 교통, 활동별 예산을 현실적으로 배분해 드립니다.",
    },
    {
      icon: MapPin,
      title: "지도 연동",
      description:
        "추천 장소를 지도에서 확인하고 효율적인 이동 동선을 파악하세요.",
    },
    {
      icon: Database,
      title: "AI HUB 데이터",
      description:
        "국내 관광 공공 데이터를 반영한 차별화된 추천을 제공합니다.",
    },
    {
      icon: Share2,
      title: "원클릭 공유",
      description:
        "생성된 일정을 링크 하나로 동행자와 즉시 공유할 수 있습니다.",
    },
    {
      icon: Shield,
      title: "무료 · 간편",
      description:
        "회원가입 없이 바로 시작. OpenRouter 무료 모델만 사용합니다.",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "조건 입력",
      text: "목적지, 일수, 예산, 여행 스타일을 선택하세요.",
    },
    {
      step: "02",
      title: "AI 생성",
      text: "수십 초 만에 맞춤 일정과 체크리스트가 완성됩니다.",
    },
    {
      step: "03",
      title: "저장 & 공유",
      text: "일정을 저장하고 링크로 친구에게 공유하세요.",
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[var(--hero-gradient)] px-4 pb-24 pt-16 text-white sm:px-6 sm:pb-32 sm:pt-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[var(--accent)]/10 blur-3xl" />
            <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <Badge
              variant="gold"
              className="animate-fade-up mb-6 border-0 bg-white/15 text-[var(--accent-on-dark)] ring-white/25"
            >
              AI HUB × OpenRouter
            </Badge>

            <h1 className="animate-fade-up animate-fade-up-delay-1 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              당신만의
              <br />
              <span className="text-gradient-gold">프리미엄 여행</span>
              을 설계하세요
            </h1>

            <p className="animate-fade-up animate-fade-up-delay-2 mx-auto mt-6 max-w-xl text-base leading-relaxed text-on-dark-muted sm:text-lg">
              TripMind AI는 조건 몇 가지만으로 일정, 장소, 맛집, 예산, 체크리스트를
              자동 생성하는 지능형 여행 플래너입니다.
            </p>

            <div className="animate-fade-up animate-fade-up-delay-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/trips/new">
                <Button variant="gold" size="lg" className="min-w-[200px]">
                  <Sparkles className="h-5 w-5" />
                  여행 시작하기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-[200px] border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/15"
                >
                  저장된 여행 보기
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-on-dark-subtle">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                약 30초 생성
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:block" />
              <span>로그인 불필요</span>
              <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:block" />
              <span>100% 무료 AI</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent-dark)]">
              Features
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--navy)] sm:text-4xl">
              여행 준비의 모든 것
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[var(--muted)]">
              복잡한 여행 계획을 단순하고 우아한 경험으로 바꿉니다.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="card-premium group p-6 sm:p-8"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--navy)]/5 transition-colors group-hover:bg-[var(--accent)]/10">
                  <feature.icon className="h-6 w-6 text-[var(--accent-dark)]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[var(--navy)]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--muted)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="border-y border-[var(--border)] bg-white px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-4xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent-dark)]">
                How it works
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--navy)] sm:text-4xl">
                3단계로 완성
              </h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {steps.map((item, i) => (
                <div key={item.step} className="relative text-center sm:text-left">
                  {i < steps.length - 1 && (
                    <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-gradient-to-r from-[var(--accent)]/40 to-transparent sm:block" />
                  )}
                  <p className="mb-4 font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--accent-dark)]/55">
                    {item.step}
                  </p>
                  <h3 className="mb-2 text-lg font-semibold text-[var(--navy)]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-14 text-center">
              <Link href="/trips/new">
                <Button variant="gold" size="lg">
                  지금 바로 시작
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
