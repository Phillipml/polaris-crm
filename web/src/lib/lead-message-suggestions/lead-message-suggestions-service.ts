import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

async function messageFromFunctionsInvokeError(error: unknown): Promise<string | null> {
  if (
    typeof error !== "object" ||
    error === null ||
    !("name" in error) ||
    !("context" in error) ||
    (error as { name: string }).name !== "FunctionsHttpError"
  ) {
    return null;
  }
  const ctx = (error as { context: unknown }).context;
  if (!(ctx instanceof Response)) {
    return null;
  }
  const ct = ctx.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return null;
  }
  try {
    const body = (await ctx.clone().json()) as {
      error?: string;
      detail?: string;
      msg?: string;
    };
    if (body.error && body.detail) {
      return `${body.error}: ${body.detail}`;
    }
    if (body.error) {
      return body.error;
    }
    if (typeof body.msg === "string") {
      return body.msg;
    }
  } catch {
    return null;
  }
  return null;
}

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
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error("Sessão ausente ou expirada. Entre novamente para gerar mensagens.");
  }

  const { data, error } = await supabase.functions.invoke("campaign-generation", {
    body: {
      campaign_id: params.campaignId,
      lead_id: params.leadId,
    },
  });

  const payload = data as { messages?: unknown; error?: string; detail?: string } | null;

  if (error) {
    const fromHttp = await messageFromFunctionsInvokeError(error);
    if (fromHttp) {
      throw new Error(fromHttp);
    }
    if (payload?.error) {
      throw new Error(
        payload.detail ? `${payload.error}: ${payload.detail}` : payload.error
      );
    }
    throw new Error(error instanceof Error ? error.message : "Falha ao chamar a função de geração.");
  }

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
