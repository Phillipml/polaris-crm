"use client";

import Link from "next/link";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useFunnelStages } from "@/hooks/use-funnel-stages";
import { useLeadCustomFieldDefinitions } from "@/hooks/use-lead-custom-field-definitions";
import { useCreateLead, useLeads } from "@/hooks/use-leads";
import { useStageRequiredFields } from "@/hooks/use-stage-required-fields";
import {
  transitionLeadStageAtomic,
  type Lead,
} from "@/lib/leads/leads-service";
import type { Json } from "@/lib/supabase/database.types";
import { STANDARD_LEAD_FIELD_LABELS } from "@/lib/stage-required-fields/lead-field-labels";
import {
  formatMissingRequirementsMessage,
  listMissingStageRequirements,
  type LeadSnapshotForRequirements,
} from "@/lib/stage-required-fields/validate-lead-for-stage-requirements";

const STORAGE_KEY = "polaris.currentWorkspaceId";

const PRIMARY_CREATE_STANDARD = new Set([
  "full_name",
  "company_name",
  "email",
]);

export default function DashboardPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [boardLeads, setBoardLeads] = useState<Lead[]>([]);
  const [dragError, setDragError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadCompany, setNewLeadCompany] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [additionalStandard, setAdditionalStandard] = useState<
    Record<string, string>
  >({});
  const [customRequirementValues, setCustomRequirementValues] = useState<
    Record<string, string>
  >({});
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { stages, isLoading: isLoadingStages } = useFunnelStages({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const baseStage = stages[0] ?? null;
  const {
    leads,
    isLoading: isLoadingLeads,
    error: leadsError,
    setLeads,
  } = useLeads({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const { createLead, isLoading: isCreatingLead } = useCreateLead();
  const {
    requirements: baseStageRequirements,
    isLoading: isLoadingBaseRequirements,
    error: baseStageRequirementsError,
  } = useStageRequiredFields({
    stageId: baseStage?.id,
    enabled: Boolean(workspaceId && baseStage && showCreateForm),
  });
  const { definitions: leadFieldDefinitions } = useLeadCustomFieldDefinitions({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });

  const customKeyToLabel = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of leadFieldDefinitions) {
      map[item.key] = item.label;
    }
    return map;
  }, [leadFieldDefinitions]);

  const extraStandardRequirements = useMemo(
    () =>
      baseStageRequirements.filter(
        (row) =>
          row.field_kind === "standard" &&
          !PRIMARY_CREATE_STANDARD.has(row.field_key)
      ),
    [baseStageRequirements]
  );

  const customRequirements = useMemo(
    () => baseStageRequirements.filter((row) => row.field_kind === "custom"),
    [baseStageRequirements]
  );

  useEffect(() => {
    if (!showCreateForm) {
      return;
    }
    setAdditionalStandard({});
    setCustomRequirementValues({});
  }, [showCreateForm]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setWorkspaceId(stored);
  }, []);

  useEffect(() => {
    setBoardLeads(leads);
  }, [leads]);

  const normalizedSearch = search.trim().toLowerCase();

  const visibleLeads = useMemo(() => {
    if (!normalizedSearch) {
      return boardLeads;
    }
    return boardLeads.filter((lead) =>
      (lead.full_name ?? "").toLowerCase().includes(normalizedSearch)
    );
  }, [boardLeads, normalizedSearch]);

  const leadsByStage = useMemo(() => {
    const grouped = new Map<string, Lead[]>();
    stages.forEach((stage) => grouped.set(stage.id, []));
    visibleLeads.forEach((lead) => {
      const list = grouped.get(lead.stage_id);
      if (list) {
        list.push(lead);
      }
    });
    grouped.forEach((list) =>
      list.sort((a, b) => a.created_at.localeCompare(b.created_at))
    );
    return grouped;
  }, [stages, visibleLeads]);

  const hasAnyLead = boardLeads.length > 0;
  const hasAnyVisibleLead = visibleLeads.length > 0;

  async function handleDragEnd(result: DropResult) {
    if (!workspaceId) return;
    const destination = result.destination;
    if (!destination) return;
    const sourceStageId = result.source.droppableId;
    const destinationStageId = destination.droppableId;
    if (sourceStageId === destinationStageId) return;

    const prevBoardLeads = boardLeads;
    const movedLead = boardLeads.find((item) => item.id === result.draggableId);
    if (!movedLead) return;

    const nextBoardLeads = boardLeads.map((item) =>
      item.id === movedLead.id
        ? { ...item, stage_id: destinationStageId }
        : item
    );
    setBoardLeads(nextBoardLeads);
    setDragError(null);

    try {
      const updated = await transitionLeadStageAtomic({
        lead_id: movedLead.id,
        workspace_id: workspaceId,
        destination_stage_id: destinationStageId,
      });
      setLeads((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setBoardLeads(prevBoardLeads);
      setDragError(readTransitionError(err, customKeyToLabel));
    }
  }

  async function handleCreateLead() {
    if (!workspaceId) {
      setCreateError("Selecione um workspace para criar lead.");
      return;
    }
    if (!baseStage) {
      setCreateError("Não há etapas disponíveis no workspace.");
      return;
    }

    const trimmedName = newLeadName.trim();
    if (!trimmedName) {
      setCreateError("Informe ao menos o nome do lead.");
      return;
    }

    if (isLoadingBaseRequirements) {
      setCreateError("Aguarde o carregamento das regras da etapa inicial.");
      return;
    }

    const custom_fields: Record<string, unknown> = {};
    for (const row of customRequirements) {
      custom_fields[row.field_key] = customRequirementValues[row.field_key] ?? "";
    }

    const ownerRaw = (additionalStandard.owner_user_id ?? "").trim();
    const snapshot: LeadSnapshotForRequirements = {
      full_name: trimmedName || null,
      company_name: newLeadCompany.trim() || null,
      email: newLeadEmail.trim() || null,
      phone: (additionalStandard.phone ?? "").trim() || null,
      job_title: (additionalStandard.job_title ?? "").trim() || null,
      linkedin_url: (additionalStandard.linkedin_url ?? "").trim() || null,
      source: (additionalStandard.source ?? "").trim() || null,
      status: (additionalStandard.status ?? "").trim() || null,
      notes: (additionalStandard.notes ?? "").trim() || null,
      owner_user_id: ownerRaw || null,
      custom_fields,
    };

    const missing = listMissingStageRequirements(
      baseStageRequirements,
      snapshot
    );
    if (missing.length > 0) {
      setCreateError(
        formatMissingRequirementsMessage(missing, customKeyToLabel)
      );
      return;
    }

    setCreateError(null);
    setCreateFeedback(null);

    try {
      const customPayload = snapshot.custom_fields as Json;
      const created = await createLead({
        workspace_id: workspaceId,
        stage_id: baseStage.id,
        full_name: snapshot.full_name,
        company_name: snapshot.company_name,
        email: snapshot.email,
        phone: snapshot.phone,
        job_title: snapshot.job_title,
        linkedin_url: snapshot.linkedin_url,
        source: snapshot.source,
        status: snapshot.status,
        notes: snapshot.notes,
        owner_user_id: snapshot.owner_user_id,
        custom_fields: customPayload,
      });
      setLeads((current) => [created, ...current]);
      setCreateFeedback("Lead criado com sucesso.");
      setNewLeadName("");
      setNewLeadCompany("");
      setNewLeadEmail("");
      setShowCreateForm(false);
    } catch {
      setCreateError("Não foi possível criar lead.");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <Card
          title="Dashboard"
          description="Kanban de leads por etapa com atualização imediata no banco."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/settings/lead-fields"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Campos do lead
            </Link>
            <Link
              href="/settings/stage-required-fields"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Regras por etapa
            </Link>
            <Link
              href="/settings/campaigns"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Campanhas
            </Link>
            <Link
              href="/onboarding/workspace"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Trocar workspace
            </Link>
            <Button
              type="button"
              onClick={() => setShowCreateForm((current) => !current)}
              disabled={!workspaceId || isCreatingLead}
            >
              Novo lead
            </Button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(280px,420px)_1fr]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar lead por nome"
              className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
            />
            {showCreateForm ? (
              <div className="grid gap-2 rounded-lg border border-(--border) bg-surface p-3 md:grid-cols-2 xl:grid-cols-4">
                {baseStage ? (
                  <p className="text-xs text-(--text-muted) md:col-span-2 xl:col-span-4">
                    Etapa inicial: {baseStage.name}. Campos extras abaixo seguem
                    as obrigatoriedades configuradas para esta etapa.
                  </p>
                ) : null}
                {isLoadingBaseRequirements ? (
                  <p className="text-xs text-(--text-muted) md:col-span-2 xl:col-span-4">
                    Carregando regras da etapa...
                  </p>
                ) : null}
                {baseStageRequirementsError ? (
                  <p className="text-xs font-medium text-red-500 md:col-span-2 xl:col-span-4">
                    {baseStageRequirementsError}
                  </p>
                ) : null}
                <input
                  value={newLeadName}
                  onChange={(event) => setNewLeadName(event.target.value)}
                  placeholder="Nome do lead"
                  className="rounded-lg border border-(--border) bg-(--surface-hover)/40 px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25 md:col-span-2"
                />
                <input
                  value={newLeadCompany}
                  onChange={(event) => setNewLeadCompany(event.target.value)}
                  placeholder="Empresa"
                  className="rounded-lg border border-(--border) bg-(--surface-hover)/40 px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                />
                <input
                  value={newLeadEmail}
                  onChange={(event) => setNewLeadEmail(event.target.value)}
                  placeholder="E-mail"
                  className="rounded-lg border border-(--border) bg-(--surface-hover)/40 px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                />
                {extraStandardRequirements.map((row) => (
                  <input
                    key={row.id}
                    value={additionalStandard[row.field_key] ?? ""}
                    onChange={(event) =>
                      setAdditionalStandard((prev) => ({
                        ...prev,
                        [row.field_key]: event.target.value,
                      }))
                    }
                    placeholder={
                      STANDARD_LEAD_FIELD_LABELS[row.field_key] ??
                      row.field_key
                    }
                    className="rounded-lg border border-(--border) bg-(--surface-hover)/40 px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25 md:col-span-1 xl:col-span-2"
                  />
                ))}
                {customRequirements.map((row) => {
                  const definition = leadFieldDefinitions.find(
                    (item) => item.key === row.field_key
                  );
                  const placeholder =
                    definition?.label ?? `Campo: ${row.field_key}`;
                  return (
                    <input
                      key={row.id}
                      value={customRequirementValues[row.field_key] ?? ""}
                      onChange={(event) =>
                        setCustomRequirementValues((prev) => ({
                          ...prev,
                          [row.field_key]: event.target.value,
                        }))
                      }
                      placeholder={placeholder}
                      className="rounded-lg border border-(--border) bg-(--surface-hover)/40 px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25 md:col-span-1 xl:col-span-2"
                    />
                  );
                })}
                <div className="flex flex-col gap-2 md:col-span-2 md:flex-row xl:col-span-4">
                  <Button
                    type="button"
                    onClick={handleCreateLead}
                    disabled={
                      isCreatingLead ||
                      isLoadingBaseRequirements ||
                      Boolean(baseStageRequirementsError)
                    }
                    className="w-full md:w-auto"
                  >
                    {isCreatingLead ? "Criando..." : "Salvar novo lead"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreatingLead}
                    className="w-full md:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div aria-live="polite" className="mt-4 min-h-6">
            {dragError ? (
              <p className="text-sm font-medium text-red-500">{dragError}</p>
            ) : null}
            {!dragError && leadsError ? (
              <p className="text-sm font-medium text-red-500">{leadsError}</p>
            ) : null}
            {!workspaceId ? (
              <p className="text-sm text-(--text-muted)">
                Selecione um workspace em onboarding para visualizar o board.
              </p>
            ) : null}
            {!dragError && !leadsError && createError ? (
              <p className="text-sm font-medium text-red-500">{createError}</p>
            ) : null}
            {!dragError && !leadsError && !createError && createFeedback ? (
              <p className="text-sm font-medium text-emerald-600">
                {createFeedback}
              </p>
            ) : null}
          </div>

          {workspaceId && (isLoadingStages || isLoadingLeads) ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <section
                  key={index}
                  className="animate-pulse rounded-xl border border-(--border) bg-surface p-3"
                >
                  <div className="h-4 w-32 rounded bg-(--surface-hover)" />
                  <div className="mt-4 space-y-2">
                    <div className="h-20 rounded-lg bg-(--surface-hover)" />
                    <div className="h-20 rounded-lg bg-(--surface-hover)" />
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {workspaceId && !isLoadingStages && !isLoadingLeads ? (
            <>
              {!hasAnyLead ? (
                <div className="mt-6 rounded-xl border border-dashed border-(--border) bg-surface p-8 text-center">
                  <p className="text-sm text-(--text-muted)">
                    Nenhum lead ainda neste workspace.
                  </p>
                  <Button
                    type="button"
                    className="mt-4"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Criar primeiro lead
                  </Button>
                </div>
              ) : null}

              {hasAnyLead && !hasAnyVisibleLead ? (
                <div className="mt-6 rounded-xl border border-dashed border-(--border) bg-surface p-8 text-center">
                  <p className="text-sm text-(--text-muted)">
                    Nenhum lead encontrado para a busca atual.
                  </p>
                </div>
              ) : null}

              {hasAnyVisibleLead ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                    {stages.map((stage) => (
                      <Droppable droppableId={stage.id} key={stage.id}>
                        {(provided, snapshot) => (
                          <section
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[180px] w-[280px] min-w-[280px] rounded-xl border p-3 transition-colors ${
                              snapshot.isDraggingOver
                                ? "border-(--primary) bg-(--surface-hover)/60"
                                : "border-(--border) bg-surface"
                            }`}
                          >
                            <header className="mb-3">
                              <h2 className="text-sm font-semibold text-text">
                                {stage.name}
                              </h2>
                              <p className="text-xs text-(--text-muted)">
                                {leadsByStage.get(stage.id)?.length ?? 0} leads
                              </p>
                            </header>

                            <div className="max-h-[56vh] space-y-2 overflow-y-auto pr-1">
                              {(leadsByStage.get(stage.id) ?? []).map(
                                (lead, index) => (
                                  <Draggable
                                    draggableId={lead.id}
                                    index={index}
                                    key={lead.id}
                                  >
                                    {(dragProvided, dragSnapshot) => (
                                      <article
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={`rounded-lg border border-(--border) bg-(--surface-hover)/40 p-3 ${
                                          dragSnapshot.isDragging
                                            ? "shadow-lg"
                                            : ""
                                        }`}
                                      >
                                        <p className="text-sm font-semibold text-text">
                                          {lead.full_name ?? "Lead sem nome"}
                                        </p>
                                        <p className="mt-1 text-xs text-(--text-muted)">
                                          {lead.company_name ?? "Sem empresa"}
                                        </p>
                                        <div className="mt-3">
                                          <Link
                                            href={`/leads/${lead.id}`}
                                            className="text-xs font-medium text-(--primary) hover:underline"
                                          >
                                            Abrir lead
                                          </Link>
                                        </div>
                                      </article>
                                    )}
                                  </Draggable>
                                )
                              )}
                              {provided.placeholder}
                            </div>
                          </section>
                        )}
                      </Droppable>
                    ))}
                  </div>
                </DragDropContext>
              ) : null}
            </>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}

function readTransitionError(
  err: unknown,
  customKeyToLabel: Record<string, string>
): string {
  if (!(err instanceof Error)) {
    return "Não foi possível mover o lead. Alteração revertida.";
  }

  try {
    const payload = JSON.parse(err.message) as {
      code?: string;
      missing_fields?: string[];
    };
    if (payload.code === "required_fields_missing" && payload.missing_fields) {
      return formatMissingRequirementsMessage(
        payload.missing_fields,
        customKeyToLabel
      );
    }
  } catch {}

  return err.message || "Não foi possível mover o lead. Alteração revertida.";
}
