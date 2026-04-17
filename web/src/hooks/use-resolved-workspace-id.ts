"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export const WORKSPACE_STORAGE_KEY = "polaris.currentWorkspaceId";

export function useResolvedWorkspaceId() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }
      if (!sessionData.session) {
        setWorkspaceId(null);
        setIsResolving(false);
        return;
      }

      const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (!stored) {
        setWorkspaceId(null);
        setIsResolving(false);
        return;
      }

      const userId = sessionData.session.user.id;
      const { data: row, error } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)
        .eq("workspace_id", stored)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error || !row) {
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        setWorkspaceId(null);
        setIsResolving(false);
        return;
      }

      setWorkspaceId(stored);
      setIsResolving(false);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return { workspaceId, isResolving };
}
