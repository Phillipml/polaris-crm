import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

type RequirementRow =
  Database["public"]["Tables"]["stage_required_fields"]["Row"];
type RequirementInsert =
  Database["public"]["Tables"]["stage_required_fields"]["Insert"];

export type StageRequiredField = RequirementRow;
export type StageRequiredFieldKind = RequirementRow["field_kind"];

export async function listStageRequiredFieldsByStage(
  stageId: string
): Promise<StageRequiredField[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("stage_required_fields")
    .select("*")
    .eq("stage_id", stageId)
    .order("field_kind", { ascending: true })
    .order("field_key", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createStageRequiredField(
  input: Omit<RequirementInsert, "id" | "created_at" | "updated_at">
): Promise<StageRequiredField> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("stage_required_fields")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteStageRequiredField(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("stage_required_fields")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
