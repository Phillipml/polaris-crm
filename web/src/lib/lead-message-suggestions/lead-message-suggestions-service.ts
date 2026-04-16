import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

type LeadMessageSuggestionRow =
  Database["public"]["Tables"]["lead_message_suggestions"]["Row"];
type LeadMessageSuggestionInsert =
  Database["public"]["Tables"]["lead_message_suggestions"]["Insert"];

export type LeadMessageSuggestion = LeadMessageSuggestionRow;

export async function listLeadMessageSuggestions(params: {
  workspaceId: string;
  leadId: string;
  campaignId: string;
}): Promise<LeadMessageSuggestion[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("lead_message_suggestions")
    .select("*")
    .eq("workspace_id", params.workspaceId)
    .eq("lead_id", params.leadId)
    .eq("campaign_id", params.campaignId)
    .order("variant_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createLeadMessageSuggestions(
  rows: LeadMessageSuggestionInsert[]
): Promise<LeadMessageSuggestion[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("lead_message_suggestions")
    .insert(rows)
    .select("*")
    .order("variant_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function generateCampaignMessages(params: {
  campaignId: string;
  leadId: string;
}): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.functions.invoke("campaign-generation", {
    body: {
      campaign_id: params.campaignId,
      lead_id: params.leadId,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  const payload = data as { messages?: unknown; error?: string; detail?: string };
  if (payload?.error) {
    throw new Error(payload.detail ? `${payload.error}: ${payload.detail}` : payload.error);
  }
  if (!Array.isArray(payload?.messages)) {
    throw new Error("Resposta inválida da função de geração.");
  }

  const messages = payload.messages
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (messages.length === 0) {
    throw new Error("A geração não retornou mensagens.");
  }

  return messages;
}
