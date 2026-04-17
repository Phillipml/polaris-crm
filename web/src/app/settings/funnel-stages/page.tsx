"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  useCreateFunnelStage,
  useDeleteFunnelStage,
  useFunnelStages,
  useLeadCountByStage,
  useReorderFunnelStages,
  useUpdateFunnelStageName,
} from "@/hooks/use-funnel-stages";
import { useResolvedWorkspaceId } from "@/hooks/use-resolved-workspace-id";

export default function FunnelStagesSettingsPage() {
  const { workspaceId, isResolving: isResolvingWorkspace } =
    useResolvedWorkspaceId();
  const [newStageName, setNewStageName] = useState("");
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteModalStageId, setDeleteModalStageId] = useState<string | null>(null);
  const [reallocateToStageId, setReallocateToStageId] = useState("");

  const { stages, isLoading, reload } = useFunnelStages({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const { countByStage, reload: reloadCounts } = useLeadCountByStage({
    workspaceId: workspaceId ?? undefined,
    enabled: Boolean(workspaceId),
  });
  const { createStage, isLoading: isCreating } = useCreateFunnelStage();
  const { updateStageName, isLoading: isUpdating } = useUpdateFunnelStageName();
  const { reorderStages, isLoading: isReordering } = useReorderFunnelStages();
  const { deleteStage, isLoading: isDeleting } = useDeleteFunnelStage();

  const deleteStageItem = useMemo(
    () => stages.find((stage) => stage.id === deleteModalStageId) ?? null,
    [deleteModalStageId, stages]
  );

  const stageOptionsForReallocation = useMemo(
    () => stages.filter((stage) => stage.id !== deleteModalStageId),
    [deleteModalStageId, stages]
  );
  const deleteStageLeadCount = deleteStageItem ? countByStage[deleteStageItem.id] ?? 0 : 0;

  useEffect(() => {
    if (!deleteModalStageId) {
      setReallocateToStageId("");
      return;
    }
    setReallocateToStageId((current) => {
      if (current && stageOptionsForReallocation.some((stage) => stage.id === current)) {
        return current;
      }
      return stageOptionsForReallocation[0]?.id ?? "";
    });
  }, [deleteModalStageId, stageOptionsForReallocation]);

  function clearMessages() {
    setFeedback(null);
    setErrorMessage(null);
  }

  async function syncAll() {
    await Promise.all([reload(), reloadCounts()]);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId) {
      setErrorMessage("Selecione um workspace.");
      return;
    }
    const normalized = newStageName.trim();
    if (!normalized) {
      setErrorMessage("Informe o nome da etapa.");
      return;
    }
    clearMessages();
    try {
      await createStage({ workspaceId, name: normalized });
      setNewStageName("");
      setFeedback("Etapa criada.");
      await syncAll();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao criar etapa.");
    }
  }

  async function handleRename(stageId: string) {
    if (!workspaceId) {
      setErrorMessage("Selecione um workspace.");
      return;
    }
    const normalized = editingStageName.trim();
    if (!normalized) {
      setErrorMessage("Informe o nome da etapa.");
      return;
    }
    clearMessages();
    try {
      await updateStageName({ workspaceId, stageId, name: normalized });
      setEditingStageId(null);
      setEditingStageName("");
      setFeedback("Etapa atualizada.");
      await syncAll();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao atualizar etapa."
      );
    }
  }

  async function handleMove(stageId: string, direction: -1 | 1) {
    if (!workspaceId) {
      return;
    }
    const index = stages.findIndex((stage) => stage.id === stageId);
    if (index < 0) {
      return;
    }
    const target = index + direction;
    if (target < 0 || target >= stages.length) {
      return;
    }
    const next = [...stages];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    clearMessages();
    try {
      await reorderStages({
        workspaceId,
        orderedStageIds: next.map((stage) => stage.id),
      });
      setFeedback("Ordem atualizada.");
      await syncAll();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erro ao reordenar etapas."
      );
    }
  }

  function openDeleteModal(stageId: string) {
    clearMessages();
    setDeleteModalStageId(stageId);
  }

  async function handleDelete(confirmReallocation: boolean) {
    if (!workspaceId || !deleteModalStageId) {
      return;
    }
    clearMessages();
    try {
      await deleteStage({
        workspaceId,
        stageId: deleteModalStageId,
        reallocateToStageId: confirmReallocation ? reallocateToStageId : undefined,
      });
      setDeleteModalStageId(null);
      setReallocateToStageId("");
      setFeedback("Etapa removida.");
      await syncAll();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao remover etapa.");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Card
          title="Configurações → Etapas do funil"
          description="Crie, renomeie, reordene e remova etapas do pipeline com segurança."
        >
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Voltar ao dashboard
            </Link>
            <Link
              href="/settings/stage-required-fields"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Regras por etapa
            </Link>
            <p className="text-xs text-(--text-muted)">
              Workspace atual:{" "}
              {isResolvingWorkspace
                ? "verificando…"
                : (workspaceId ?? "não selecionado — vá ao onboarding")}
            </p>
          </div>

          <form className="mb-6 flex flex-wrap gap-2" onSubmit={handleCreate}>
            <input
              value={newStageName}
              onChange={(event) => setNewStageName(event.target.value)}
              placeholder="Nome da nova etapa"
              className="w-full min-w-[220px] flex-1 rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
            />
            <Button type="submit" disabled={!workspaceId || isCreating}>
              {isCreating ? "Criando..." : "Criar etapa"}
            </Button>
          </form>

          {isResolvingWorkspace || isLoading ? (
            <p className="text-sm text-(--text-muted)">Carregando etapas...</p>
          ) : null}

          {!isResolvingWorkspace &&
          !isLoading &&
          workspaceId &&
          stages.length === 0 ? (
            <p className="text-sm text-(--text-muted)">
              Nenhuma etapa encontrada para este workspace. Se o workspace foi
              recriado após reset do banco, confira se as etapas padrão foram
              criadas ou crie uma etapa abaixo.
            </p>
          ) : null}

          {!isResolvingWorkspace && !workspaceId && !isLoading ? (
            <p className="text-sm text-(--text-muted)">
              Nenhum workspace válido no navegador. Acesse onboarding e
              selecione um workspace.
            </p>
          ) : null}

          {stages.length > 0 ? (
            <div className="space-y-3">
              {stages.map((stage, index) => {
                const leadCount = countByStage[stage.id] ?? 0;
                const isEditing = editingStageId === stage.id;
                return (
                  <article
                    key={stage.id}
                    className="rounded-xl border border-(--border) bg-surface p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        {isEditing ? (
                          <input
                            value={editingStageName}
                            onChange={(event) => setEditingStageName(event.target.value)}
                            className="w-full min-w-[220px] rounded-lg border border-(--border) bg-(--surface-hover)/30 px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                          />
                        ) : (
                          <p className="text-sm font-semibold text-text">{stage.name}</p>
                        )}
                        <p className="text-xs text-(--text-muted)">
                          Posição: {stage.position} · Leads: {leadCount}
                          {stage.is_system ? " · etapa de sistema" : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void handleMove(stage.id, -1)}
                          disabled={index === 0 || isReordering}
                        >
                          Subir
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void handleMove(stage.id, 1)}
                          disabled={index === stages.length - 1 || isReordering}
                        >
                          Descer
                        </Button>
                        {!isEditing ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setEditingStageId(stage.id);
                              setEditingStageName(stage.name);
                              clearMessages();
                            }}
                          >
                            Renomear
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              onClick={() => void handleRename(stage.id)}
                              disabled={isUpdating}
                            >
                              Salvar
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setEditingStageId(null);
                                setEditingStageName("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => openDeleteModal(stage.id)}
                          disabled={isDeleting || stage.is_system}
                          title={
                            stage.is_system
                              ? "Etapas padrão do funil não podem ser removidas."
                              : undefined
                          }
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          <div aria-live="polite" className="mt-4 min-h-6">
            {errorMessage ? (
              <p className="text-sm font-medium text-red-500">{errorMessage}</p>
            ) : null}
            {!errorMessage && feedback ? (
              <p className="text-sm font-medium text-emerald-600">{feedback}</p>
            ) : null}
          </div>
        </Card>
      </div>

      {deleteStageItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-(--border) bg-surface p-6 shadow-xl">
            <h3 className="text-base font-semibold text-text">
              Remover etapa: {deleteStageItem.name}
            </h3>
            <p className="mt-2 text-sm text-(--text-muted)">
              Esta etapa possui {deleteStageLeadCount} lead(s).
              {deleteStageLeadCount > 0
                ? " Para remover, realoque os leads para outra etapa."
                : " Confirme para remover."}
            </p>
            {deleteStageLeadCount > 0 ? (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium text-text">
                  Realocar leads para
                </label>
                <select
                  value={reallocateToStageId}
                  onChange={(event) => setReallocateToStageId(event.target.value)}
                  className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
                >
                  {stageOptionsForReallocation.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteModalStageId(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void handleDelete(deleteStageLeadCount > 0)}
                disabled={(deleteStageLeadCount > 0 && !reallocateToStageId) || isDeleting}
              >
                {isDeleting
                  ? "Removendo..."
                  : deleteStageLeadCount > 0
                    ? "Realocar e remover"
                    : "Remover etapa"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
