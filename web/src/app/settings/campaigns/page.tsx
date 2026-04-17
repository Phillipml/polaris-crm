"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useResolvedWorkspaceId } from "@/hooks/use-resolved-workspace-id";

export default function CampaignsListPage() {
  const { workspaceId } = useResolvedWorkspaceId();
  const { campaigns, isLoading, error } = useCampaigns({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Card
          title="Campanhas"
          description="Edite contexto e prompt para geração de mensagens com o modelo configurado no projeto."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Voltar ao dashboard
            </Link>
            <Link
              href="/settings/campaigns/new"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold tracking-tight text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Nova campanha
            </Link>
          </div>
          <div className="mt-6">
            {!workspaceId ? (
              <p className="text-sm text-(--text-muted)">
                Selecione um workspace no onboarding para listar campanhas.
              </p>
            ) : null}
            {workspaceId && error ? (
              <p className="text-sm font-medium text-red-500">{error}</p>
            ) : null}
            {workspaceId && isLoading ? (
              <p className="text-sm text-(--text-muted)">Carregando...</p>
            ) : null}
            {workspaceId && !isLoading && !error && campaigns.length === 0 ? (
              <p className="text-sm text-(--text-muted)">
                Nenhuma campanha ainda. Crie a primeira para definir contexto e
                prompt.
              </p>
            ) : null}
            {workspaceId && !isLoading && campaigns.length > 0 ? (
              <ul className="divide-y divide-(--border) rounded-xl border border-(--border) bg-surface">
                {campaigns.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/settings/campaigns/${row.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-(--surface-hover)/60"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text">
                          {row.name}
                        </p>
                        <p className="text-xs text-(--text-muted)">
                          {row.channel} ·{" "}
                          {row.is_active ? "Ativa" : "Inativa"}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-(--primary)">
                        Editar →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
