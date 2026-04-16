import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export type Lead = LeadRow;

export type ListLeadsParams = {
  workspaceId: string;
  stageId?: string;
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

export async function updateLead(input: UpdateLeadInput): Promise<Lead> {
  const { id, workspace_id, ...patch } = input;
  const supabase = getSupabaseBrowserClient();
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

  return data;
}
