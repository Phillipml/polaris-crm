import Image from "next/image";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-(--border) bg-(--surface-elevated)/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
            aria-hidden
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-text">
              PolarisCRM
            </p>
            <p className="text-xs text-(--text-muted)">MVP · App Router</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
