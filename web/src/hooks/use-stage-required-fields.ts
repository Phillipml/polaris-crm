"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createStageRequiredField,
  deleteStageRequiredField,
  listStageRequiredFieldsByStage,
  type StageRequiredField,
  type StageRequiredFieldKind,
} from "@/lib/stage-required-fields/stage-required-fields-service";

type MutationState = {
  isLoading: boolean;
  error: string | null;
};

export function useStageRequiredFields(params: {
  stageId?: string;
  enabled?: boolean;
}) {
  const { stageId, enabled = true } = params;
  const [requirements, setRequirements] = useState<StageRequiredField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !stageId) {
      setRequirements([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const rows = await listStageRequiredFieldsByStage(stageId);
      setRequirements(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar obrigatoriedades."
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled, stageId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { requirements, setRequirements, isLoading, error, reload };
}

export function useCreateStageRequiredField() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (input: {
      stage_id: string;
      field_key: string;
      field_kind: StageRequiredFieldKind;
    }) => {
      setState({ isLoading: true, error: null });
      try {
        const created = await createStageRequiredField(input);
        setState({ isLoading: false, error: null });
        return created;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao criar obrigatoriedade.";
        setState({ isLoading: false, error: message });
        throw err;
      }
    },
    []
  );

  return { ...state, createRequirement: mutate };
}

export function useDeleteStageRequiredField() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (id: string) => {
    setState({ isLoading: true, error: null });
    try {
      await deleteStageRequiredField(id);
      setState({ isLoading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao remover obrigatoriedade.";
      setState({ isLoading: false, error: message });
      throw err;
    }
  }, []);

  return { ...state, deleteRequirement: mutate };
}
