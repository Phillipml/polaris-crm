import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export async function fetchLeadGenerationSignals(params: {
  workspaceId: string;
  leadId: string;
}): Promise<{ hasPending: boolean; lastAutoAt: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const pendingRes = await supabase
    .from("generation_jobs")
    .select("id")
    .eq("workspace_id", params.workspaceId)
    .eq("lead_id", params.leadId)
    .eq("status", "pending")
    .maybeSingle();

  const hasPending = Boolean(!pendingRes.error && pendingRes.data?.id);

  const sugRes = await supabase
    .from("lead_message_suggestions")
    .select("created_at")
    .eq("workspace_id", params.workspaceId)
    .eq("lead_id", params.leadId)
    .eq("source", "auto_trigger")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastAutoAt =
    !sugRes.error && sugRes.data?.created_at ? sugRes.data.created_at : null;

  return { hasPending, lastAutoAt };
}
