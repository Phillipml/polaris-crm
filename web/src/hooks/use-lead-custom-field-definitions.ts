"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createLeadCustomFieldDefinition,
  deleteLeadCustomFieldDefinition,
  listLeadCustomFieldDefinitions,
  updateLeadCustomFieldDefinition,
  type CreateLeadCustomFieldDefinitionInput,
  type LeadCustomFieldDefinition,
  type UpdateLeadCustomFieldDefinitionInput,
} from "@/lib/lead-custom-fields/lead-custom-field-definitions-service";

type MutationState = {
  isLoading: boolean;
  error: string | null;
};

export function useLeadCustomFieldDefinitions(params: {
  workspaceId?: string;
  enabled?: boolean;
}) {
  const { workspaceId, enabled = true } = params;
  const [definitions, setDefinitions] = useState<LeadCustomFieldDefinition[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !workspaceId) {
      setDefinitions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const rows = await listLeadCustomFieldDefinitions(workspaceId);
      setDefinitions(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar campos personalizados."
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled, workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { definitions, setDefinitions, isLoading, error, reload };
}

export function useCreateLeadCustomFieldDefinition() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (input: CreateLeadCustomFieldDefinitionInput) => {
      setState({ isLoading: true, error: null });
      try {
        const created = await createLeadCustomFieldDefinition(input);
        setState({ isLoading: false, error: null });
        return created;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao criar campo.";
        setState({ isLoading: false, error: message });
        throw err;
      }
    },
    []
  );

  return { ...state, createDefinition: mutate };
}

export function useUpdateLeadCustomFieldDefinition() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (input: UpdateLeadCustomFieldDefinitionInput) => {
      setState({ isLoading: true, error: null });
      try {
        const updated = await updateLeadCustomFieldDefinition(input);
        setState({ isLoading: false, error: null });
        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar campo.";
        setState({ isLoading: false, error: message });
        throw err;
      }
    },
    []
  );

  return { ...state, updateDefinition: mutate };
}

export function useDeleteLeadCustomFieldDefinition() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (input: { id: string; workspace_id: string }) => {
      setState({ isLoading: true, error: null });
      try {
        await deleteLeadCustomFieldDefinition(input);
        setState({ isLoading: false, error: null });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao remover campo.";
        setState({ isLoading: false, error: message });
        throw err;
      }
    },
    []
  );

  return { ...state, deleteDefinition: mutate };
}
