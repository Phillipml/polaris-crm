import { AppShell } from "@/components/layout/AppShell";
import { SupabaseEnvBadge } from "@/components/dev/SupabaseEnvBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            Base técnica
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
            PolarisCRM está pronto para evoluir
          </h1>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-[var(--text-muted)] sm:text-xl">
            Estrutura MVP com Next.js App Router, TypeScript, tema claro/escuro
            persistente e cliente Supabase no browser. Telas de negócio entram
            na sequência.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <SupabaseEnvBadge />
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-2">
          <Card
            title="Design system leve"
            description="Componentes reutilizáveis, espaçamento generoso e tipografia B2B com IBM Plex Sans."
          >
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primário</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </Card>
          <Card
            title="Supabase (browser)"
            description="Use getSupabaseBrowserClient() apenas em código cliente após configurar as variáveis públicas."
          >
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              O SDK está instalado; a integração de dados e autenticação virá
              nas próximas entregas. Consulte o README em{" "}
              <code className="rounded bg-[var(--surface-hover)] px-1.5 py-0.5 text-xs text-[var(--text)]">
                web/
              </code>{" "}
              para variáveis de ambiente.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
