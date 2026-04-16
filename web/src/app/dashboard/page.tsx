import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Card
          title="Dashboard"
          description="Você está autenticado e já caiu na área principal do produto."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button>Ver pipeline</Button>
            <Link
              href="/onboarding/workspace"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Ir para onboarding
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
