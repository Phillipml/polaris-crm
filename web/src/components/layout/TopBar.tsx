import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-elevated)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%)",
            }}
            aria-hidden
          >
            P
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-[var(--text)]">
              PolarisCRM
            </p>
            <p className="text-xs text-[var(--text-muted)]">MVP · App Router</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
