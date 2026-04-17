"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  useCreateLeadCustomFieldDefinition,
  useDeleteLeadCustomFieldDefinition,
  useLeadCustomFieldDefinitions,
  useUpdateLeadCustomFieldDefinition,
} from "@/hooks/use-lead-custom-field-definitions";
import { useResolvedWorkspaceId } from "@/hooks/use-resolved-workspace-id";
import type {
  LeadCustomFieldDefinition,
  LeadCustomFieldType,
} from "@/lib/lead-custom-fields/lead-custom-field-definitions-service";

const fieldTypeOptions: Array<{ value: LeadCustomFieldType; label: string }> = [
  { value: "text", label: "Texto livre" },
  { value: "number", label: "Número" },
  { value: "boolean", label: "Sim ou não" },
  { value: "date", label: "Data" },
  { value: "select", label: "Lista de opções" },
];

export default function LeadFieldsSettingsPage() {
  const { workspaceId } = useResolvedWorkspaceId();
  const [formKey, setFormKey] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formType, setFormType] = useState<LeadCustomFieldType>("text");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { definitions, isLoading, reload } = useLeadCustomFieldDefinitions({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });

  const { createDefinition, isLoading: isCreating } =
    useCreateLeadCustomFieldDefinition();
  const { updateDefinition, isLoading: isUpdating } =
    useUpdateLeadCustomFieldDefinition();
  const { deleteDefinition, isLoading: isDeleting } =
    useDeleteLeadCustomFieldDefinition();

  const isSubmitting = isCreating || isUpdating;

  const typeLabelByValue = useMemo(() => {
    const map = new Map<LeadCustomFieldType, string>();
    for (const option of fieldTypeOptions) {
      map.set(option.value, option.label);
    }
    return map;
  }, []);

  const submitLabel = useMemo(() => {
    if (isSubmitting && editingId) {
      return "Salvando...";
    }
    if (isSubmitting) {
      return "Criando...";
    }
    return editingId ? "Salvar alterações" : "Criar campo";
  }, [editingId, isSubmitting]);

  function resetForm() {
    setEditingId(null);
    setFormKey("");
    setFormLabel("");
    setFormType("text");
  }

  function normalizeKey(raw: string) {
    return raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_");
  }

  function hasDuplicateKey(
    key: string,
    list: LeadCustomFieldDefinition[],
    currentId?: string | null
  ) {
    return list.some((item) => item.key === key && item.id !== currentId);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId) {
      setErrorMessage(
        "Selecione um workspace no onboarding antes de configurar."
      );
      return;
    }

    const normalizedKey = normalizeKey(formKey);
    const normalizedLabel = formLabel.trim();
    if (!normalizedKey || !normalizedLabel) {
      setErrorMessage("Preencha o identificador e o nome exibido.");
      return;
    }

    if (hasDuplicateKey(normalizedKey, definitions, editingId)) {
      setErrorMessage("Já existe um campo com este identificador.");
      return;
    }

    setErrorMessage(null);
    setFeedback(null);

    try {
      if (editingId) {
        await updateDefinition({
          id: editingId,
          workspace_id: workspaceId,
          key: normalizedKey,
          label: normalizedLabel,
          type: formType,
        });
        setFeedback("Campo atualizado com sucesso.");
      } else {
        await createDefinition({
          workspace_id: workspaceId,
          key: normalizedKey,
          label: normalizedLabel,
          type: formType,
        });
        setFeedback("Campo criado com sucesso.");
      }

      resetForm();
      await reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível salvar o campo.";
      if (message.toLowerCase().includes("duplicate")) {
        setErrorMessage("Já existe um campo com este identificador.");
        return;
      }
      setErrorMessage("Não foi possível salvar o campo.");
    }
  }

  function handleEdit(item: LeadCustomFieldDefinition) {
    setEditingId(item.id);
    setFormKey(item.key);
    setFormLabel(item.label);
    setFormType(item.type);
    setErrorMessage(null);
    setFeedback(null);
  }

  async function handleDelete(item: LeadCustomFieldDefinition) {
    if (!workspaceId) {
      return;
    }
    setErrorMessage(null);
    setFeedback(null);
    try {
      await deleteDefinition({ id: item.id, workspace_id: workspaceId });
      if (editingId === item.id) {
        resetForm();
      }
      setFeedback("Campo removido com sucesso.");
      await reload();
    } catch {
      setErrorMessage("Não foi possível remover o campo.");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Card
          title="Configurações → Campos do lead"
          description="Defina campos extras do lead (nome na tela, tipo de resposta). O identificador interno é gerado a partir do que você digitar e serve para o sistema e relatórios."
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
            <Link
              href="/settings/stage-required-fields"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Regras por etapa
            </Link>
            <p className="text-xs text-(--text-muted)">
              Workspace atual: {workspaceId ?? "não selecionado"}
            </p>
          </div>

          <form className="grid gap-4 sm:grid-cols-4" onSubmit={handleSubmit}>
            <div className="space-y-1 sm:col-span-1">
              <label htmlFor="key" className="text-sm font-medium">
                Identificador interno
              </label>
              <input
                id="key"
                value={formKey}
                onChange={(event) => setFormKey(event.target.value)}
                placeholder="Ex.: segmento de mercado"
                className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                required
              />
              <p className="text-xs text-(--text-muted)">
                Ao salvar, o sistema normaliza em minúsculas e usa sublinhado
                no lugar de espaços (ex.: segmento_mercado).
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="label" className="text-sm font-medium">
                Nome na tela
              </label>
              <input
                id="label"
                value={formLabel}
                onChange={(event) => setFormLabel(event.target.value)}
                placeholder="Ex.: Segmento de mercado"
                className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                required
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label htmlFor="type" className="text-sm font-medium">
                Tipo de resposta
              </label>
              <select
                id="type"
                value={formType}
                onChange={(event) =>
                  setFormType(event.target.value as LeadCustomFieldType)
                }
                className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
              >
                {fieldTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2 sm:col-span-4">
              <Button type="submit" disabled={isSubmitting || !workspaceId}>
                {submitLabel}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancelar edição
                </Button>
              ) : null}
            </div>
          </form>

          <div aria-live="polite" className="mt-4 min-h-6">
            {errorMessage ? (
              <p className="text-sm font-medium text-red-500">{errorMessage}</p>
            ) : null}
            {!errorMessage && feedback ? (
              <p className="text-sm font-medium text-emerald-600">{feedback}</p>
            ) : null}
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-(--border)">
                  <th className="py-2 pr-4 font-semibold">Identificador</th>
                  <th className="py-2 pr-4 font-semibold">Nome na tela</th>
                  <th className="py-2 pr-4 font-semibold">Tipo de resposta</th>
                  <th className="py-2 pr-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="py-3 text-(--text-muted)" colSpan={4}>
                      Carregando campos...
                    </td>
                  </tr>
                ) : null}
                {!isLoading && definitions.length === 0 ? (
                  <tr>
                    <td className="py-3 text-(--text-muted)" colSpan={4}>
                      Nenhum campo personalizado cadastrado.
                    </td>
                  </tr>
                ) : null}
                {!isLoading
                  ? definitions.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-(--border)/60"
                      >
                        <td className="py-3 pr-4 text-xs text-(--text-muted)">
                          {item.key}
                        </td>
                        <td className="py-3 pr-4 font-medium">{item.label}</td>
                        <td className="py-3 pr-4">
                          {typeLabelByValue.get(item.type) ?? item.type}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleEdit(item)}
                              disabled={isDeleting}
                              className="px-3 py-1.5 text-xs"
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleDelete(item)}
                              disabled={isDeleting}
                              className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10"
                            >
                              {isDeleting ? "Removendo..." : "Remover"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
