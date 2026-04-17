"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createFunnelStage,
  deleteFunnelStage,
  listLeadCountByStage,
  listFunnelStagesByWorkspace,
  reorderFunnelStages,
  type FunnelStage,
  updateFunnelStageName,
} from "@/lib/funnel-stages/funnel-stages-service";

export function useFunnelStages(params: {
  workspaceId?: string;
  enabled?: boolean;
}) {
  const { workspaceId, enabled = true } = params;
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !workspaceId) {
      setStages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rows = await listFunnelStagesByWorkspace(workspaceId);
      setStages(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar etapas.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { stages, isLoading, error, reload };
}

type MutationState = {
  isLoading: boolean;
  error: string | null;
};

export function useCreateFunnelStage() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (input: { workspaceId: string; name: string }) => {
      setState({ isLoading: true, error: null });
      try {
        const row = await createFunnelStage(input);
        setState({ isLoading: false, error: null });
        return row;
      } catch (err) {
        setState({
          isLoading: false,
          error: err instanceof Error ? err.message : "Erro ao criar etapa.",
        });
        throw err;
      }
    },
    []
  );

  return { ...state, createStage: mutate };
}

export function useUpdateFunnelStageName() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (input: { workspaceId: string; stageId: string; name: string }) => {
      setState({ isLoading: true, error: null });
      try {
        const row = await updateFunnelStageName(input);
        setState({ isLoading: false, error: null });
        return row;
      } catch (err) {
        setState({
          isLoading: false,
          error: err instanceof Error ? err.message : "Erro ao renomear etapa.",
        });
        throw err;
      }
    },
    []
  );

  return { ...state, updateStageName: mutate };
}

export function useReorderFunnelStages() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (input: { workspaceId: string; orderedStageIds: string[] }) => {
      setState({ isLoading: true, error: null });
      try {
        const rows = await reorderFunnelStages(input);
        setState({ isLoading: false, error: null });
        return rows;
      } catch (err) {
        setState({
          isLoading: false,
          error: err instanceof Error ? err.message : "Erro ao reordenar etapas.",
        });
        throw err;
      }
    },
    []
  );

  return { ...state, reorderStages: mutate };
}

export function useDeleteFunnelStage() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (input: {
      workspaceId: string;
      stageId: string;
      reallocateToStageId?: string;
    }) => {
      setState({ isLoading: true, error: null });
      try {
        await deleteFunnelStage(input);
        setState({ isLoading: false, error: null });
      } catch (err) {
        setState({
          isLoading: false,
          error: err instanceof Error ? err.message : "Erro ao remover etapa.",
        });
        throw err;
      }
    },
    []
  );

  return { ...state, deleteStage: mutate };
}

export function useLeadCountByStage(params: {
  workspaceId?: string;
  enabled?: boolean;
}) {
  const { workspaceId, enabled = true } = params;
  const [countByStage, setCountByStage] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !workspaceId) {
      setCountByStage({});
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await listLeadCountByStage({ workspaceId });
      setCountByStage(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao contar leads por etapa."
      );
      setCountByStage({});
    } finally {
      setIsLoading(false);
    }
  }, [enabled, workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { countByStage, isLoading, error, reload };
}
