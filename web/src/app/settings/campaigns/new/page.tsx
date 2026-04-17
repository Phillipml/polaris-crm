"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CampaignForm,
  type CampaignFormValues,
} from "@/components/campaigns/CampaignForm";
import { Card } from "@/components/ui/Card";
import { useCreateCampaign } from "@/hooks/use-campaigns";
import { useFunnelStages } from "@/hooks/use-funnel-stages";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const STORAGE_KEY = "polaris.currentWorkspaceId";

export default function NewCampaignPage() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { stages } = useFunnelStages({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const { createCampaign, isLoading } = useCreateCampaign();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setWorkspaceId(stored);
  }, []);

  async function handleSubmit(values: CampaignFormValues) {
    if (!workspaceId) {
      setFormError("Selecione um workspace no onboarding.");
      return;
    }
    const trimmed = values.name.trim();
    if (!trimmed) {
      setFormError("Informe o nome da campanha.");
      return;
    }
    setFormError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;

      const created = await createCampaign({
        workspace_id: workspaceId,
        name: trimmed,
        channel: values.channel,
        description: values.description || null,
        is_active: values.is_active,
        context_markdown: values.context_markdown || null,
        generation_prompt: values.generation_prompt,
        trigger_stage_id: values.trigger_stage_id,
        created_by: userId,
      });
      router.replace(`/settings/campaigns/${created.id}`);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar a campanha."
      );
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Card
          title="Nova campanha"
          description="Contexto e prompt alimentam a Edge Function de geração de mensagens."
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
              Selecione um workspace no onboarding para criar campanhas.
            </p>
          ) : (
            <CampaignForm
              stages={stages}
              submitLabel="Criar campanha"
              isSubmitting={isLoading}
              formError={formError}
              onSubmit={handleSubmit}
            />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
