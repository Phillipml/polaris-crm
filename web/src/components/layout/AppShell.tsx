import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/TopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text)]">
      <TopBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
