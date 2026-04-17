import { recordFieldsUpdatedActivityIfNeeded } from "@/lib/lead-activities/lead-activities-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export type Lead = LeadRow;

export type ListLeadsParams = {
  workspaceId: string;
  stageId?: string;
  ownerUserId?: string;
  searchText?: string;
};

export type CreateLeadInput = Omit<
  LeadInsert,
  "id" | "created_at" | "updated_at"
> & {
  workspace_id: string;
  stage_id: string;
};

export type UpdateLeadInput = Omit<
  LeadUpdate,
  "id" | "created_at" | "updated_at" | "workspace_id"
> & {
  id: string;
  workspace_id: string;
};

export async function listLeadsByWorkspaceAndStage({
  workspaceId,
  stageId,
  ownerUserId,
  searchText,
}: ListLeadsParams): Promise<Lead[]> {
  const supabase = getSupabaseBrowserClient();
  let query = supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (stageId) {
    query = query.eq("stage_id", stageId);
  }

  if (ownerUserId) {
    query = query.eq("owner_user_id", ownerUserId);
  }

  const normalizedSearch = searchText?.trim();
  if (normalizedSearch) {
    const escaped = normalizedSearch.replace(/[%_]/g, "\\$&");
    query = query.or(
      `full_name.ilike.%${escaped}%,company_name.ilike.%${escaped}%,email.ilike.%${escaped}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("leads")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getLeadById(params: {
  workspaceId: string;
  leadId: string;
}): Promise<Lead> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", params.workspaceId)
    .eq("id", params.leadId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateLead(input: UpdateLeadInput): Promise<Lead> {
  const { id, workspace_id, ...patch } = input;
  const supabase = getSupabaseBrowserClient();
  const { data: before, error: beforeError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .maybeSingle();

  if (beforeError) {
    throw new Error(beforeError.message);
  }

  if (!before) {
    throw new Error("Lead não encontrado.");
  }

  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    await recordFieldsUpdatedActivityIfNeeded({
      supabase,
      workspaceId: workspace_id,
      leadId: id,
      before,
      after: data,
    });
  } catch {
    return data;
  }

  return data;
}

export async function transitionLeadStageAtomic(params: {
  workspace_id: string;
  lead_id: string;
  destination_stage_id: string;
}): Promise<Lead> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("transition_lead_stage_atomic", {
    p_workspace_id: params.workspace_id,
    p_lead_id: params.lead_id,
    p_destination_stage_id: params.destination_stage_id,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as Lead;
}
