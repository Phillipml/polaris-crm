"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listCampaignMessageCounts,
  type CampaignMessageCount,
} from "@/lib/dashboard/secondary-metrics-service";

export function useCampaignMessageCounts(params: {
  workspaceId?: string;
  enabled?: boolean;
}) {
  const { workspaceId, enabled = true } = params;
  const [counts, setCounts] = useState<CampaignMessageCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !workspaceId) {
      setCounts([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await listCampaignMessageCounts({ workspaceId });
      setCounts(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar mensagens."
      );
      setCounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { counts, isLoading, error, reload };
}
