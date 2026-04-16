import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
type CampaignUpdate = Database["public"]["Tables"]["campaigns"]["Update"];

export type Campaign = CampaignRow;

export type CreateCampaignInput = Omit<
  CampaignInsert,
  "id" | "created_at" | "updated_at"
> & {
  workspace_id: string;
};

export type UpdateCampaignInput = Omit<
  CampaignUpdate,
  "created_at" | "updated_at" | "workspace_id"
> & {
  id: string;
  workspace_id: string;
};

export async function listCampaignsByWorkspace(
  workspaceId: string
): Promise<Campaign[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getCampaignById(params: {
  id: string;
  workspaceId: string;
}): Promise<Campaign | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", params.id)
    .eq("workspace_id", params.workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<Campaign> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      workspace_id: input.workspace_id,
      name: input.name,
      channel: input.channel ?? "email",
      description: input.description ?? null,
      is_active: input.is_active ?? true,
      context_markdown: input.context_markdown ?? null,
      generation_prompt: input.generation_prompt ?? "",
      trigger_stage_id: input.trigger_stage_id ?? null,
      created_by: input.created_by ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Campanha não retornada após criação.");
  }

  return data;
}

export async function updateCampaign(
  input: UpdateCampaignInput
): Promise<Campaign> {
  const supabase = getSupabaseBrowserClient();
  const { id, workspace_id, ...rest } = input;
  const { data, error } = await supabase
    .from("campaigns")
    .update(rest)
    .eq("id", id)
    .eq("workspace_id", workspace_id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Campanha não encontrada.");
  }

  return data;
}
