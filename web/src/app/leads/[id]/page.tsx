"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLeadCustomFieldDefinitions } from "@/hooks/use-lead-custom-field-definitions";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import { getLeadById, updateLead, type Lead } from "@/lib/leads/leads-service";
import type { Json } from "@/lib/supabase/database.types";

const STORAGE_KEY = "polaris.currentWorkspaceId";

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
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setWorkspaceId(stored);
  }, []);

  useEffect(() => {
    async function loadLead() {
      if (!workspaceId || !leadId) {
        setIsLoadingLead(false);
        return;
      }

      if (!isValidLeadId) {
        setLead(null);
        setErrorMessage("ID de lead inválido.");
        setIsLoadingLead(false);
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
  }, [isValidLeadId, leadId, workspaceId]);

  const membersOptions = useMemo(
    () =>
      members.map((member) => ({
        value: member.user_id,
        label: `${member.user_id.slice(0, 8)}... (${member.role})`,
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

          {isLoadingLead ? (
            <p className="text-sm text-(--text-muted)">Carregando lead...</p>
          ) : null}

          {!isLoadingLead && !lead ? (
            <p className="text-sm text-red-500">Lead não encontrado.</p>
          ) : null}

          {!isLoadingLead && lead ? (
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

              <div aria-live="polite" className="min-h-6">
                {errorMessage ? (
                  <p className="text-sm font-medium text-red-500">
                    {errorMessage}
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
          ) : null}
        </Card>
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
