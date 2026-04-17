"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CampaignForm,
  type CampaignFormValues,
} from "@/components/campaigns/CampaignForm";
import { Card } from "@/components/ui/Card";
import { useCampaign, useUpdateCampaign } from "@/hooks/use-campaigns";
import { useFunnelStages } from "@/hooks/use-funnel-stages";

const STORAGE_KEY = "polaris.currentWorkspaceId";

export default function EditCampaignPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { campaign, isLoading, error, reload } = useCampaign({
    id,
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId && id),
  });
  const { stages } = useFunnelStages({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const { updateCampaign, isLoading: isSaving } = useUpdateCampaign();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setWorkspaceId(stored);
  }, []);

  const initialValues = useMemo(() => {
    if (!campaign) return undefined;
    return {
      name: campaign.name,
      channel: campaign.channel,
      description: campaign.description ?? "",
      context_markdown: campaign.context_markdown ?? "",
      generation_prompt: campaign.generation_prompt,
      is_active: campaign.is_active,
      trigger_stage_id: campaign.trigger_stage_id,
    };
  }, [campaign]);

  async function handleSubmit(values: CampaignFormValues) {
    if (!workspaceId || !campaign) {
      setFormError("Sessão ou campanha inválida.");
      return;
    }
    const trimmed = values.name.trim();
    if (!trimmed) {
      setFormError("Informe o nome da campanha.");
      return;
    }
    setFormError(null);
    setSuccessMessage(null);
    try {
      await updateCampaign({
        id: campaign.id,
        workspace_id: workspaceId,
        name: trimmed,
        channel: values.channel,
        description: values.description || null,
        is_active: values.is_active,
        context_markdown: values.context_markdown || null,
        generation_prompt: values.generation_prompt,
        trigger_stage_id: values.trigger_stage_id,
      });
      await reload();
      setSuccessMessage("Alterações salvas.");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a campanha."
      );
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Card
          title={campaign?.name ? `Editar: ${campaign.name}` : "Editar campanha"}
          description="Ajuste contexto, prompt, etapa gatilho e status ativo."
        >
          <div className="mb-6">
            <Link
              href="/settings/campaigns"
              className="text-sm font-medium text-(--primary) hover:underline"
            >
              ← Lista de campanhas
            </Link>
          </div>
          {!workspaceId ? (
            <p className="text-sm text-(--text-muted)">
              Selecione um workspace no onboarding.
            </p>
          ) : null}
          {workspaceId && isLoading ? (
            <p className="text-sm text-(--text-muted)">Carregando...</p>
          ) : null}
          {workspaceId && !isLoading && error ? (
            <p className="text-sm font-medium text-red-500">{error}</p>
          ) : null}
          {workspaceId && !isLoading && !error && !campaign ? (
            <p className="text-sm text-(--text-muted)">
              Campanha não encontrada ou sem permissão.
            </p>
          ) : null}
          {workspaceId && campaign && initialValues ? (
            <>
              <div aria-live="polite" className="mb-4 min-h-6">
                {successMessage ? (
                  <p className="text-sm font-medium text-emerald-600">
                    {successMessage}
                  </p>
                ) : null}
              </div>
              <CampaignForm
                stages={stages}
                initialValues={initialValues}
                submitLabel="Salvar alterações"
                isSubmitting={isSaving}
                formError={formError}
                onSubmit={handleSubmit}
              />
            </>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}
