"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { useFunnelStages } from "@/hooks/use-funnel-stages";
import { useLeadCustomFieldDefinitions } from "@/hooks/use-lead-custom-field-definitions";
import {
  useCreateStageRequiredField,
  useDeleteStageRequiredField,
  useStageRequiredFields,
} from "@/hooks/use-stage-required-fields";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { StageRequiredFieldKind } from "@/lib/stage-required-fields/stage-required-fields-service";

const STORAGE_KEY = "polaris.currentWorkspaceId";
const standardFieldKeys = [
  "full_name",
  "company_name",
  "email",
  "phone",
  "job_title",
  "linkedin_url",
  "source",
  "status",
  "notes",
  "owner_user_id",
] as const;

const leadMapeadoPreset: Array<{
  field_kind: StageRequiredFieldKind;
  field_key: string;
}> = [
  { field_kind: "standard", field_key: "full_name" },
  { field_kind: "standard", field_key: "company_name" },
  { field_kind: "standard", field_key: "linkedin_url" },
];

export default function StageRequiredFieldsSettingsPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [fieldKind, setFieldKind] =
    useState<StageRequiredFieldKind>("standard");
  const [fieldKey, setFieldKey] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);

  const { stages, isLoading: isLoadingStages } = useFunnelStages({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const { definitions } = useLeadCustomFieldDefinitions({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const { requirements, isLoading, reload } = useStageRequiredFields({
    stageId: selectedStageId || undefined,
    enabled: Boolean(selectedStageId),
  });
  const { createRequirement, isLoading: isCreating } =
    useCreateStageRequiredField();
  const { deleteRequirement, isLoading: isDeleting } =
    useDeleteStageRequiredField();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setWorkspaceId(stored);
  }, []);

  useEffect(() => {
    if (!stages.length) {
      setSelectedStageId("");
      return;
    }
    setSelectedStageId((current) =>
      current && stages.some((stage) => stage.id === current)
        ? current
        : stages[0].id
    );
  }, [stages]);

  useEffect(() => {
    async function checkRole() {
      if (!workspaceId) {
        setIsCheckingRole(false);
        setIsAdmin(false);
        return;
      }
      setIsCheckingRole(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) {
          setIsAdmin(false);
          return;
        }
        const { data, error } = await supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId)
          .single();
        if (error) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(data.role === "owner" || data.role === "admin");
      } finally {
        setIsCheckingRole(false);
      }
    }
    void checkRole();
  }, [workspaceId]);

  const selectedStage = useMemo(
    () => stages.find((stage) => stage.id === selectedStageId) ?? null,
    [selectedStageId, stages]
  );

  const customFieldOptions = useMemo(
    () => definitions.map((item) => item.key),
    [definitions]
  );

  function resetForm() {
    setFieldKind("standard");
    setFieldKey("");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStageId) {
      setErrorMessage("Selecione uma etapa.");
      return;
    }
    const normalizedFieldKey = fieldKey.trim();
    if (!normalizedFieldKey) {
      setErrorMessage("Informe o campo obrigatório.");
      return;
    }
    const duplicated = requirements.some(
      (item) =>
        item.field_kind === fieldKind && item.field_key === normalizedFieldKey
    );
    if (duplicated) {
      setErrorMessage("Este requisito já está cadastrado na etapa.");
      return;
    }

    setErrorMessage(null);
    setFeedback(null);

    try {
      await createRequirement({
        stage_id: selectedStageId,
        field_kind: fieldKind,
        field_key: normalizedFieldKey,
      });
      setFeedback("Obrigatoriedade adicionada.");
      resetForm();
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("duplicate")) {
        setErrorMessage("Este requisito já está cadastrado na etapa.");
        return;
      }
      setErrorMessage("Não foi possível adicionar obrigatoriedade.");
    }
  }

  async function handleDelete(id: string) {
    setErrorMessage(null);
    setFeedback(null);
    try {
      await deleteRequirement(id);
      setFeedback("Obrigatoriedade removida.");
      await reload();
    } catch {
      setErrorMessage("Não foi possível remover obrigatoriedade.");
    }
  }

  async function handleApplyLeadMapeadoPreset() {
    if (!selectedStageId) return;
    setIsApplyingPreset(true);
    setErrorMessage(null);
    setFeedback(null);
    try {
      for (const preset of leadMapeadoPreset) {
        const exists = requirements.some(
          (item) =>
            item.field_kind === preset.field_kind &&
            item.field_key === preset.field_key
        );
        if (!exists) {
          await createRequirement({
            stage_id: selectedStageId,
            field_kind: preset.field_kind,
            field_key: preset.field_key,
          });
        }
      }
      await reload();
      setFeedback("Preset Lead Mapeado aplicado.");
    } catch {
      setErrorMessage("Não foi possível aplicar preset.");
    } finally {
      setIsApplyingPreset(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Card
          title="Configurações → Obrigatoriedades por etapa"
          description="Defina quais campos são obrigatórios para movimentar o lead para cada etapa."
        >
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Voltar ao dashboard
            </Link>
            <Link
              href="/onboarding/workspace"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Trocar workspace
            </Link>
            <p className="text-xs text-(--text-muted)">
              Workspace atual: {workspaceId ?? "não selecionado"}
            </p>
          </div>

          {isCheckingRole ? (
            <p className="text-sm text-(--text-muted)">
              Validando permissões...
            </p>
          ) : null}
          {!isCheckingRole && !isAdmin ? (
            <p className="text-sm font-medium text-red-500">
              Apenas admin/owner do workspace pode alterar obrigatoriedades por
              etapa.
            </p>
          ) : null}

          {!isCheckingRole && isAdmin ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="stage" className="text-sm font-medium">
                    Etapa
                  </label>
                  <select
                    id="stage"
                    value={selectedStageId}
                    onChange={(event) => setSelectedStageId(event.target.value)}
                    className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                  >
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.position}. {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleApplyLeadMapeadoPreset}
                    disabled={!selectedStageId || isApplyingPreset}
                  >
                    {isApplyingPreset
                      ? "Aplicando..."
                      : "Aplicar exemplo Lead Mapeado"}
                  </Button>
                </div>
              </div>

              <form
                className="mt-6 grid gap-4 sm:grid-cols-4"
                onSubmit={handleCreate}
              >
                <div className="space-y-1 sm:col-span-1">
                  <label htmlFor="fieldKind" className="text-sm font-medium">
                    field_kind
                  </label>
                  <select
                    id="fieldKind"
                    value={fieldKind}
                    onChange={(event) =>
                      setFieldKind(event.target.value as StageRequiredFieldKind)
                    }
                    className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                  >
                    <option value="standard">standard</option>
                    <option value="custom">custom</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-3">
                  <label htmlFor="fieldKey" className="text-sm font-medium">
                    field_key
                  </label>
                  {fieldKind === "standard" ? (
                    <select
                      id="fieldKey"
                      value={fieldKey}
                      onChange={(event) => setFieldKey(event.target.value)}
                      className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                    >
                      <option value="">Selecione...</option>
                      {standardFieldKeys.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      id="fieldKey"
                      value={fieldKey}
                      onChange={(event) => setFieldKey(event.target.value)}
                      className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                    >
                      <option value="">Selecione um custom field...</option>
                      {customFieldOptions.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="sm:col-span-4">
                  <Button
                    type="submit"
                    disabled={!selectedStageId || isCreating || isLoadingStages}
                  >
                    {isCreating
                      ? "Adicionando..."
                      : "Adicionar obrigatoriedade"}
                  </Button>
                </div>
              </form>

              <div aria-live="polite" className="mt-4 min-h-6">
                {errorMessage ? (
                  <p className="text-sm font-medium text-red-500">
                    {errorMessage}
                  </p>
                ) : null}
                {!errorMessage && feedback ? (
                  <p className="text-sm font-medium text-emerald-600">
                    {feedback}
                  </p>
                ) : null}
              </div>

              <div className="mt-8 overflow-x-auto">
                <p className="mb-3 text-sm font-medium">
                  Etapa selecionada: {selectedStage?.name ?? "-"}
                </p>
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-(--border)">
                      <th className="py-2 pr-4 font-semibold">field_kind</th>
                      <th className="py-2 pr-4 font-semibold">field_key</th>
                      <th className="py-2 pr-4 font-semibold">ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td className="py-3 text-(--text-muted)" colSpan={3}>
                          Carregando obrigatoriedades...
                        </td>
                      </tr>
                    ) : null}
                    {!isLoading && requirements.length === 0 ? (
                      <tr>
                        <td className="py-3 text-(--text-muted)" colSpan={3}>
                          Nenhuma obrigatoriedade definida para esta etapa.
                        </td>
                      </tr>
                    ) : null}
                    {!isLoading
                      ? requirements.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-(--border)/60"
                          >
                            <td className="py-3 pr-4">{item.field_kind}</td>
                            <td className="py-3 pr-4 font-mono text-xs">
                              {item.field_key}
                            </td>
                            <td className="py-3 pr-4">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                disabled={isDeleting}
                                className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10"
                              >
                                {isDeleting ? "Removendo..." : "Remover"}
                              </Button>
                            </td>
                          </tr>
                        ))
                      : null}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}
