"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LeadActivitiesTimeline } from "@/components/leads/LeadActivitiesTimeline";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useFunnelStages } from "@/hooks/use-funnel-stages";
import { useLeadCustomFieldDefinitions } from "@/hooks/use-lead-custom-field-definitions";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import { memberAssigneeOptionLabel } from "@/lib/workspaces/member-assignee-label";
import { getLeadById, updateLead, type Lead } from "@/lib/leads/leads-service";
import {
  createLeadMessageSuggestions,
  generateCampaignMessages,
  listLeadMessageSuggestions,
  type LeadMessageSuggestion,
} from "@/lib/lead-message-suggestions/lead-message-suggestions-service";
import {
  listLeadActivities,
  type LeadActivity,
} from "@/lib/lead-activities/lead-activities-service";
import { sendOutreachAndMoveLead } from "@/lib/outreach-events/outreach-events-service";
import { fetchLeadGenerationSignals } from "@/lib/generation-jobs/generation-jobs-service";
import { useResolvedWorkspaceId } from "@/hooks/use-resolved-workspace-id";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Json } from "@/lib/supabase/database.types";

const GENERATION_POLL_MS = 2000;
const GENERATION_POLL_MAX_MS = 90_000;

type StandardFormState = {
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  job_title: string;
  linkedin_url: string;
  source: string;
  status: string;
};

export default function LeadDetailsPage() {
  const params = useParams<{ id: string }>();
  const leadId = String(params?.id ?? "");
  const isValidLeadId = isUuid(leadId);
  const { workspaceId, isResolving } = useResolvedWorkspaceId();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingMessages, setIsGeneratingMessages] = useState(false);
  const [isSendingMessageId, setIsSendingMessageId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [suggestions, setSuggestions] = useState<LeadMessageSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasPendingGenerationJob, setHasPendingGenerationJob] = useState(false);
  const [lastAutoGenerationAt, setLastAutoGenerationAt] = useState<string | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [standardForm, setStandardForm] = useState<StandardFormState>({
    full_name: "",
    company_name: "",
    email: "",
    phone: "",
    job_title: "",
    linkedin_url: "",
    source: "",
    status: "",
  });
  const [ownerUserId, setOwnerUserId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [customFieldsState, setCustomFieldsState] = useState<
    Record<string, string | boolean>
  >({});

  const { definitions } = useLeadCustomFieldDefinitions({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const { members } = useWorkspaceMembers({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const { campaigns } = useCampaigns({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const { stages } = useFunnelStages({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const activeCampaigns = useMemo(
    () => campaigns.filter((item) => item.is_active),
    [campaigns]
  );

  useEffect(() => {
    void (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!workspaceId || !lead?.id) {
      setActivities([]);
      return undefined;
    }

    let cancelled = false;
    setActivitiesLoading(true);
    setActivitiesError(null);

    void (async () => {
      try {
        const rows = await listLeadActivities({
          workspaceId,
          leadId: lead.id,
        });
        if (!cancelled) {
          setActivities(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setActivitiesError(
            err instanceof Error ? err.message : "Erro ao carregar atividades."
          );
          setActivities([]);
        }
      } finally {
        if (!cancelled) {
          setActivitiesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, lead?.id, lead?.updated_at]);

  useEffect(() => {
    async function loadLead() {
      if (!leadId) {
        setIsLoadingLead(false);
        return;
      }

      if (!isValidLeadId) {
        setLead(null);
        setErrorMessage("ID de lead inválido.");
        setIsLoadingLead(false);
        return;
      }

      if (!workspaceId) {
        if (isResolving) {
          setIsLoadingLead(true);
          return;
        }
        setIsLoadingLead(false);
        setLead(null);
        return;
      }

      setIsLoadingLead(true);
      setErrorMessage(null);
      try {
        const row = await getLeadById({ workspaceId, leadId });
        setLead(row);
        setStandardForm({
          full_name: row.full_name ?? "",
          company_name: row.company_name ?? "",
          email: row.email ?? "",
          phone: row.phone ?? "",
          job_title: row.job_title ?? "",
          linkedin_url: row.linkedin_url ?? "",
          source: row.source ?? "",
          status: row.status ?? "",
        });
        setOwnerUserId(row.owner_user_id ?? "");
        setNotes(row.notes ?? "");
        const custom = isObject(row.custom_fields) ? row.custom_fields : {};
        const state: Record<string, string | boolean> = {};
        Object.entries(custom).forEach(([key, value]) => {
          if (typeof value === "boolean") {
            state[key] = value;
            return;
          }
          if (
            typeof value === "string" ||
            typeof value === "number" ||
            value === null
          ) {
            state[key] = value == null ? "" : String(value);
          }
        });
        setCustomFieldsState(state);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Não foi possível carregar lead."
        );
      } finally {
        setIsLoadingLead(false);
      }
    }

    void loadLead();
  }, [isResolving, isValidLeadId, leadId, workspaceId]);

  useEffect(() => {
    if (activeCampaigns.length === 0) {
      setSelectedCampaignId("");
      return;
    }
    setSelectedCampaignId((current) =>
      current && activeCampaigns.some((item) => item.id === current)
        ? current
        : activeCampaigns[0].id
    );
  }, [activeCampaigns]);

  useEffect(() => {
    async function loadSuggestions() {
      if (!workspaceId || !lead || !selectedCampaignId) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      setSuggestionsError(null);
      try {
        const rows = await listLeadMessageSuggestions({
          workspaceId,
          leadId: lead.id,
          campaignId: selectedCampaignId,
        });
        setSuggestions(rows);
      } catch (err) {
        setSuggestionsError(
          err instanceof Error ? err.message : "Não foi possível carregar sugestões."
        );
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }

    void loadSuggestions();
  }, [lead, selectedCampaignId, workspaceId]);

  useEffect(() => {
    if (!workspaceId || !lead || !isValidLeadId) {
      setHasPendingGenerationJob(false);
      setLastAutoGenerationAt(null);
      return;
    }

    void (async () => {
      try {
        const signals = await fetchLeadGenerationSignals({
          workspaceId,
          leadId: lead.id,
        });
        setHasPendingGenerationJob(signals.hasPending);
        setLastAutoGenerationAt(signals.lastAutoAt);
      } catch {
        setHasPendingGenerationJob(false);
      }
    })();
  }, [workspaceId, lead, isValidLeadId]);

  useEffect(() => {
    if (!hasPendingGenerationJob || !workspaceId || !lead || !isValidLeadId) {
      return;
    }

    const leadId = lead.id;

    const run = async () => {
      try {
        const signals = await fetchLeadGenerationSignals({
          workspaceId,
          leadId,
        });
        setHasPendingGenerationJob(signals.hasPending);
        setLastAutoGenerationAt(signals.lastAutoAt);
        if (selectedCampaignId) {
          const rows = await listLeadMessageSuggestions({
            workspaceId,
            leadId,
            campaignId: selectedCampaignId,
          });
          setSuggestions(rows);
        }
      } catch {
        setHasPendingGenerationJob(false);
      }
    };

    void run();
    const intervalId = window.setInterval(() => void run(), GENERATION_POLL_MS);
    const stopId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, GENERATION_POLL_MAX_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(stopId);
    };
  }, [hasPendingGenerationJob, workspaceId, lead, isValidLeadId, selectedCampaignId]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const membersOptions = useMemo(
    () =>
      members.map((member) => ({
        value: member.user_id,
        label: memberAssigneeOptionLabel(
          member.user_id,
          member.email,
          member.role
        ),
      })),
    [members]
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || !lead) {
      setErrorMessage("Workspace ou lead não disponível.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const customFieldsPayload: Record<string, Json> = {};
      definitions.forEach((definition) => {
        const rawValue = customFieldsState[definition.key];
        if (definition.type === "boolean") {
          customFieldsPayload[definition.key] = Boolean(rawValue);
          return;
        }
        if (typeof rawValue === "string") {
          const trimmed = rawValue.trim();
          if (!trimmed) {
            customFieldsPayload[definition.key] = null;
            return;
          }
          if (definition.type === "number") {
            const parsed = Number(trimmed);
            customFieldsPayload[definition.key] = Number.isNaN(parsed)
              ? null
              : parsed;
            return;
          }
          customFieldsPayload[definition.key] = trimmed;
          return;
        }
        customFieldsPayload[definition.key] = null;
      });

      const updated = await updateLead({
        id: lead.id,
        workspace_id: workspaceId,
        full_name: nullable(standardForm.full_name),
        company_name: nullable(standardForm.company_name),
        email: nullable(standardForm.email),
        phone: nullable(standardForm.phone),
        job_title: nullable(standardForm.job_title),
        linkedin_url: nullable(standardForm.linkedin_url),
        source: nullable(standardForm.source),
        status: nullable(standardForm.status),
        owner_user_id: ownerUserId || null,
        notes: nullable(notes),
        custom_fields: customFieldsPayload,
      });

      setLead(updated);
      setSuccessMessage("Lead salvo com sucesso.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Não foi possível salvar lead."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerate(sourceMode: "generate" | "regenerate") {
    if (!workspaceId || !lead || !selectedCampaignId) {
      setSuggestionsError("Selecione uma campanha ativa para gerar mensagens.");
      return;
    }

    setIsGeneratingMessages(true);
    setSuggestionsError(null);
    setSuccessMessage(null);
    try {
      const generatedMessages = await generateCampaignMessages({
        campaignId: selectedCampaignId,
        leadId: lead.id,
      });
      const nextVariantBase = suggestions.reduce(
        (max, row) => Math.max(max, row.variant_index),
        0
      );
      const inserted = await createLeadMessageSuggestions(
        generatedMessages.map((content, index) => ({
          workspace_id: workspaceId,
          lead_id: lead.id,
          campaign_id: selectedCampaignId,
          content,
          variant_index: nextVariantBase + index + 1,
          source: "manual",
        }))
      );
      setSuggestions((current) => [...current, ...inserted]);
      setSuccessMessage(
        sourceMode === "generate"
          ? "Mensagens geradas e salvas no histórico."
          : "Nova rodada gerada e adicionada ao histórico."
      );
    } catch (err) {
      setSuggestionsError(
        err instanceof Error ? err.message : "Não foi possível gerar mensagens."
      );
    } finally {
      setIsGeneratingMessages(false);
    }
  }

  async function handleCopy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setToastMessage("Mensagem copiada.");
    } catch {
      setToastMessage("Falha ao copiar.");
    }
  }

  async function handleSendMessage(item: LeadMessageSuggestion) {
    if (!workspaceId || !lead) {
      setSuggestionsError("Workspace ou lead não disponível para envio.");
      return;
    }

    setIsSendingMessageId(item.id);
    setSuggestionsError(null);
    setSuccessMessage(null);
    try {
      const updatedLead = await sendOutreachAndMoveLead({
        workspaceId,
        leadId: lead.id,
        campaignId: item.campaign_id,
        message: item.content,
      });
      setLead(updatedLead);
      setSuccessMessage("Mensagem enviada e lead movido para Tentando Contato.");
    } catch (err) {
      setSuggestionsError(readSendError(err));
    } finally {
      setIsSendingMessageId(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Card
          title="Lead"
          description="Edite dados padrão, campos customizados, responsável e observações."
        >
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Voltar ao dashboard
            </Link>
            <p className="text-xs text-(--text-muted)">
              Workspace atual: {workspaceId ?? "não selecionado"}
            </p>
          </div>

          {isResolving || isLoadingLead ? (
            <p className="text-sm text-(--text-muted)">Carregando lead...</p>
          ) : null}

          {!isResolving && !workspaceId && leadId && isValidLeadId ? (
            <p className="text-sm text-(--text-muted)">
              Selecione um workspace no dashboard para carregar este lead.
            </p>
          ) : null}

          {!isResolving && !isLoadingLead && !lead && leadId ? (
            errorMessage ? (
              <p className="text-sm text-red-500">{errorMessage}</p>
            ) : workspaceId && isValidLeadId ? (
              <p className="text-sm text-red-500">Lead não encontrado.</p>
            ) : null
          ) : null}

          {!isLoadingLead && lead ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
            <form className="space-y-8" onSubmit={handleSave}>
              <section className="space-y-4">
                <h2 className="text-base font-semibold">Dados padrão</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Nome"
                    value={standardForm.full_name}
                    onChange={(value) =>
                      setStandardForm((current) => ({
                        ...current,
                        full_name: value,
                      }))
                    }
                  />
                  <Field
                    label="Empresa"
                    value={standardForm.company_name}
                    onChange={(value) =>
                      setStandardForm((current) => ({
                        ...current,
                        company_name: value,
                      }))
                    }
                  />
                  <Field
                    label="E-mail"
                    value={standardForm.email}
                    onChange={(value) =>
                      setStandardForm((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                  />
                  <Field
                    label="Telefone"
                    value={standardForm.phone}
                    onChange={(value) =>
                      setStandardForm((current) => ({
                        ...current,
                        phone: value,
                      }))
                    }
                  />
                  <Field
                    label="Cargo"
                    value={standardForm.job_title}
                    onChange={(value) =>
                      setStandardForm((current) => ({
                        ...current,
                        job_title: value,
                      }))
                    }
                  />
                  <Field
                    label="LinkedIn"
                    value={standardForm.linkedin_url}
                    onChange={(value) =>
                      setStandardForm((current) => ({
                        ...current,
                        linkedin_url: value,
                      }))
                    }
                  />
                  <Field
                    label="Origem"
                    value={standardForm.source}
                    onChange={(value) =>
                      setStandardForm((current) => ({
                        ...current,
                        source: value,
                      }))
                    }
                  />
                  <Field
                    label="Status"
                    value={standardForm.status}
                    onChange={(value) =>
                      setStandardForm((current) => ({
                        ...current,
                        status: value,
                      }))
                    }
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-base font-semibold">Campos personalizados</h2>
                {definitions.length === 0 ? (
                  <p className="text-sm text-(--text-muted)">
                    Nenhuma definição encontrada em Configurações → Campos do
                    lead.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {definitions.map((definition) => {
                      const toggleId = `custom-field-${definition.id}`;
                      const checked = Boolean(
                        customFieldsState[definition.key]
                      );
                      if (definition.type === "boolean") {
                        return (
                          <div key={definition.id} className="space-y-2">
                            <span className="block text-sm font-medium text-text">
                              {definition.label}
                            </span>
                            <div className="w-full max-w-sm space-y-2 rounded-xl border border-(--border) bg-(--surface-hover)/25 px-4 py-3">
                              <div className="flex items-center gap-3">
                                <input
                                  id={toggleId}
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) =>
                                    setCustomFieldsState((current) => ({
                                      ...current,
                                      [definition.key]: event.target.checked,
                                    }))
                                  }
                                  className="h-5 w-5 shrink-0 cursor-pointer rounded border border-(--border) bg-surface accent-(--primary) focus:outline-none focus:ring-2 focus:ring-(--ring)/35"
                                />
                                <label
                                  htmlFor={toggleId}
                                  className="cursor-pointer select-none text-sm font-medium leading-snug text-text"
                                >
                                  {checked ? "Sim, ativado" : "Não, desativado"}
                                </label>
                              </div>
                              <p className="text-xs leading-snug text-(--text-muted)">
                                Marque apenas se esta informação se aplica a este
                                lead.
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={definition.id} className="space-y-1">
                          <label
                            className="text-sm font-medium"
                            htmlFor={`field-${definition.id}`}
                          >
                            {definition.label}
                          </label>
                          <input
                            id={`field-${definition.id}`}
                            type={
                              definition.type === "number" ? "number" : "text"
                            }
                            value={String(
                              customFieldsState[definition.key] ?? ""
                            )}
                            onChange={(event) =>
                              setCustomFieldsState((current) => ({
                                ...current,
                                [definition.key]: event.target.value,
                              }))
                            }
                            className="w-full min-h-11 rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h2 className="text-base font-semibold">Responsável</h2>
                <select
                  value={ownerUserId}
                  onChange={(event) => setOwnerUserId(event.target.value)}
                  className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25 sm:max-w-md"
                >
                  <option value="">Sem responsável</option>
                  {membersOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </section>

              <section className="space-y-4">
                <h2 className="text-base font-semibold">Observações</h2>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                />
              </section>

              <section className="space-y-4">
                <h2 className="text-base font-semibold">Geração de mensagens</h2>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {hasPendingGenerationJob ? (
                    <span className="inline-flex w-fit items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
                      Gerando sugestões…
                    </span>
                  ) : null}
                  {lastAutoGenerationAt ? (
                    <p className="text-xs text-(--text-muted)">
                      Última geração automática em{" "}
                      {new Date(lastAutoGenerationAt).toLocaleString("pt-BR")}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-3 rounded-xl border border-(--border) bg-(--surface-hover)/25 p-4">
                  <div className="grid gap-2 sm:max-w-md">
                    <label htmlFor="campaign-selector" className="text-sm font-medium">
                      Campanha ativa
                    </label>
                    <select
                      id="campaign-selector"
                      value={selectedCampaignId}
                      onChange={(event) => setSelectedCampaignId(event.target.value)}
                      className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                    >
                      {activeCampaigns.length === 0 ? (
                        <option value="">Nenhuma campanha ativa</option>
                      ) : null}
                      {activeCampaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => void handleGenerate("generate")}
                      disabled={
                        isGeneratingMessages ||
                        !workspaceId ||
                        !lead ||
                        !selectedCampaignId
                      }
                    >
                      {isGeneratingMessages ? "Gerando..." : "Gerar"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void handleGenerate("regenerate")}
                      disabled={
                        isGeneratingMessages ||
                        !workspaceId ||
                        !lead ||
                        !selectedCampaignId
                      }
                    >
                      Regenerar
                    </Button>
                  </div>
                  <p className="text-xs text-(--text-muted)">
                    Decisão desta branch: regenerar cria nova rodada e mantém histórico completo.
                  </p>
                </div>

                {isLoadingSuggestions ? (
                  <p className="text-sm text-(--text-muted)">Carregando sugestões...</p>
                ) : null}
                {!isLoadingSuggestions &&
                selectedCampaignId &&
                suggestions.length === 0 ? (
                  <p className="text-sm text-(--text-muted)">
                    Ainda não há sugestões para esta campanha neste lead.
                  </p>
                ) : null}
                {suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-xl border border-(--border) bg-surface p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-(--text-muted)">
                            Variante #{item.variant_index} ·{" "}
                            {new Date(item.created_at).toLocaleString("pt-BR")}
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => void handleCopy(item.content)}
                          >
                            Copiar
                          </Button>
                          <Button
                            type="button"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => void handleSendMessage(item)}
                            disabled={isSendingMessageId === item.id}
                          >
                            {isSendingMessageId === item.id ? "Enviando..." : "Enviar"}
                          </Button>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                          {item.content}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>

              <div aria-live="polite" className="min-h-6">
                {errorMessage ? (
                  <p className="text-sm font-medium text-red-500">
                    {errorMessage}
                  </p>
                ) : null}
                {!errorMessage && suggestionsError ? (
                  <p className="text-sm font-medium text-red-500">
                    {suggestionsError}
                  </p>
                ) : null}
                {!errorMessage && successMessage ? (
                  <p className="text-sm font-medium text-emerald-600">
                    {successMessage}
                  </p>
                ) : null}
              </div>

              <Button type="submit" disabled={isSaving || !workspaceId}>
                {isSaving ? "Salvando..." : "Salvar lead"}
              </Button>
            </form>
            <LeadActivitiesTimeline
              activities={activities}
              isLoading={activitiesLoading}
              error={activitiesError}
              currentUserId={currentUserId}
              stages={stages}
              campaigns={campaigns.map((item) => ({
                id: item.id,
                name: item.name,
              }))}
            />
            </div>
          ) : null}
        </Card>
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-4 right-4 z-50"
        >
          {toastMessage ? (
            <div className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-bg-base shadow-lg">
              {toastMessage}
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{props.label}</label>
      <input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
      />
    </div>
  );
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isObject(value: Json): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function readSendError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "Não foi possível enviar a mensagem.";
  }

  try {
    const payload = JSON.parse(err.message) as {
      code?: string;
      missing_fields?: string[];
    };
    if (payload.code === "required_fields_missing") {
      return "Envio bloqueado por campos obrigatórios da etapa Tentando Contato. Preencha os campos pendentes no lead ou relaxe os requisitos dessa etapa no seed/demo.";
    }
  } catch {}

  if (err.message.includes("required_fields_missing")) {
    return "Envio bloqueado por campos obrigatórios da etapa Tentando Contato. Preencha os campos pendentes no lead ou relaxe os requisitos dessa etapa no seed/demo.";
  }

  return err.message || "Não foi possível enviar a mensagem.";
}
