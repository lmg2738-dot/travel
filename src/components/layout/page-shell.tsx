import { Header } from "./header";
import { Footer } from "./footer";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className={className ?? "mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12"}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
