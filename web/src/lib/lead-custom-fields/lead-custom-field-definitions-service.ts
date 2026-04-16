import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

type DefinitionRow =
  Database["public"]["Tables"]["lead_custom_field_definitions"]["Row"];
type DefinitionInsert =
  Database["public"]["Tables"]["lead_custom_field_definitions"]["Insert"];
type DefinitionUpdate =
  Database["public"]["Tables"]["lead_custom_field_definitions"]["Update"];

export type LeadCustomFieldType = DefinitionRow["type"];
export type LeadCustomFieldDefinition = DefinitionRow;

export type CreateLeadCustomFieldDefinitionInput = Omit<
  DefinitionInsert,
  "id" | "created_at" | "updated_at"
>;

export type UpdateLeadCustomFieldDefinitionInput = Omit<
  DefinitionUpdate,
  "workspace_id" | "created_at" | "updated_at"
> & {
  id: string;
  workspace_id: string;
};

export async function listLeadCustomFieldDefinitions(
  workspaceId: string
): Promise<LeadCustomFieldDefinition[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("lead_custom_field_definitions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createLeadCustomFieldDefinition(
  input: CreateLeadCustomFieldDefinitionInput
): Promise<LeadCustomFieldDefinition> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("lead_custom_field_definitions")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateLeadCustomFieldDefinition(
  input: UpdateLeadCustomFieldDefinitionInput
): Promise<LeadCustomFieldDefinition> {
  const { id, workspace_id, ...patch } = input;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("lead_custom_field_definitions")
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

export async function deleteLeadCustomFieldDefinition(params: {
  id: string;
  workspace_id: string;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("lead_custom_field_definitions")
    .delete()
    .eq("id", params.id)
    .eq("workspace_id", params.workspace_id);

  if (error) {
    throw new Error(error.message);
  }
}
