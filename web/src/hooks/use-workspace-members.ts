"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listWorkspaceMembers,
  type WorkspaceMember,
} from "@/lib/workspaces/workspace-members-service";

export function useWorkspaceMembers(params: {
  workspaceId?: string;
  enabled?: boolean;
}) {
  const { workspaceId, enabled = true } = params;
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !workspaceId) {
      setMembers([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const rows = await listWorkspaceMembers(workspaceId);
      setMembers(rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar membros."
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled, workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { members, isLoading, error, reload };
}
