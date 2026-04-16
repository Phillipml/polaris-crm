"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createCampaign,
  getCampaignById,
  listCampaignsByWorkspace,
  updateCampaign,
  type Campaign,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from "@/lib/campaigns/campaigns-service";

type MutationState = {
  isLoading: boolean;
  error: string | null;
};

export function useCampaigns(params: {
  workspaceId?: string;
  enabled?: boolean;
}) {
  const { workspaceId, enabled = true } = params;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !workspaceId) {
      setCampaigns([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rows = await listCampaignsByWorkspace(workspaceId);
      setCampaigns(rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao listar campanhas."
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled, workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { campaigns, isLoading, error, reload, setCampaigns };
}

export function useCampaign(params: {
  id?: string;
  workspaceId?: string;
  enabled?: boolean;
}) {
  const { id, workspaceId, enabled = true } = params;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !workspaceId || !id) {
      setCampaign(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const row = await getCampaignById({ id, workspaceId });
      setCampaign(row);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar campanha."
      );
      setCampaign(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, id, workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { campaign, isLoading, error, reload, setCampaign };
}

export function useCreateCampaign() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (input: CreateCampaignInput) => {
    setState({ isLoading: true, error: null });
    try {
      const created = await createCampaign(input);
      setState({ isLoading: false, error: null });
      return created;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar campanha.";
      setState({ isLoading: false, error: message });
      throw err;
    }
  }, []);

  return { ...state, createCampaign: mutate };
}

export function useUpdateCampaign() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (input: UpdateCampaignInput) => {
    setState({ isLoading: true, error: null });
    try {
      const updated = await updateCampaign(input);
      setState({ isLoading: false, error: null });
      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar campanha.";
      setState({ isLoading: false, error: message });
      throw err;
    }
  }, []);

  return { ...state, updateCampaign: mutate };
}
