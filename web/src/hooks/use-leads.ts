"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createLead,
  listLeadsByWorkspaceAndStage,
  updateLead,
  type CreateLeadInput,
  type Lead,
  type UpdateLeadInput,
} from "@/lib/leads/leads-service";

type UseLeadsParams = {
  workspaceId?: string;
  stageId?: string;
  ownerUserId?: string;
  searchText?: string;
  enabled?: boolean;
};

type MutationState = {
  isLoading: boolean;
  error: string | null;
};

export function useLeads({
  workspaceId,
  stageId,
  ownerUserId,
  searchText,
  enabled = true,
}: UseLeadsParams) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !workspaceId) {
      setLeads([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await listLeadsByWorkspaceAndStage({
        workspaceId,
        stageId,
        ownerUserId,
        searchText,
      });
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao listar leads.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, ownerUserId, searchText, stageId, workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { leads, isLoading, error, reload, setLeads };
}

export function useCreateLead() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (input: CreateLeadInput) => {
    setState({ isLoading: true, error: null });
    try {
      const created = await createLead(input);
      setState({ isLoading: false, error: null });
      return created;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar lead.";
      setState({ isLoading: false, error: message });
      throw err;
    }
  }, []);

  return { ...state, createLead: mutate };
}

export function useUpdateLead() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (input: UpdateLeadInput) => {
    setState({ isLoading: true, error: null });
    try {
      const updated = await updateLead(input);
      setState({ isLoading: false, error: null });
      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar lead.";
      setState({ isLoading: false, error: message });
      throw err;
    }
  }, []);

  return { ...state, updateLead: mutate };
}
