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

export async function createFunnelStage(params: {
  workspaceId: string;
  name: string;
}): Promise<FunnelStage> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("create_funnel_stage", {
    p_workspace_id: params.workspaceId,
    p_name: params.name,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as FunnelStage;
}

export async function updateFunnelStageName(params: {
  workspaceId: string;
  stageId: string;
  name: string;
}): Promise<FunnelStage> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("update_funnel_stage_name", {
    p_workspace_id: params.workspaceId,
    p_stage_id: params.stageId,
    p_name: params.name,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as FunnelStage;
}

export async function reorderFunnelStages(params: {
  workspaceId: string;
  orderedStageIds: string[];
}): Promise<FunnelStage[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("reorder_funnel_stages", {
    p_workspace_id: params.workspaceId,
    p_stage_ids: params.orderedStageIds,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data as FunnelStage[]) ?? [];
}

export async function deleteFunnelStage(params: {
  workspaceId: string;
  stageId: string;
  reallocateToStageId?: string;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc("delete_funnel_stage", {
    p_workspace_id: params.workspaceId,
    p_stage_id: params.stageId,
    p_reallocate_to_stage_id: params.reallocateToStageId ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listLeadCountByStage(params: {
  workspaceId: string;
}): Promise<Record<string, number>> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("leads")
    .select("stage_id")
    .eq("workspace_id", params.workspaceId);

  if (error) {
    throw new Error(error.message);
  }

  const countByStage: Record<string, number> = {};
  for (const row of data ?? []) {
    countByStage[row.stage_id] = (countByStage[row.stage_id] ?? 0) + 1;
  }
  return countByStage;
}
