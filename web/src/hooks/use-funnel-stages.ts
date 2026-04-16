"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listFunnelStagesByWorkspace,
  type FunnelStage,
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
