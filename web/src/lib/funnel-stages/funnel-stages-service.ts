import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

export type FunnelStage = Database["public"]["Tables"]["funnel_stages"]["Row"];

export async function listFunnelStagesByWorkspace(
  workspaceId: string
): Promise<FunnelStage[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("funnel_stages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const byId = new Map<string, FunnelStage>();
  for (const row of rows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
    }
  }
  return [...byId.values()].sort((a, b) => a.position - b.position);
}
