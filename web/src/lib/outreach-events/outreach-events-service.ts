import { insertOutreachSentActivity } from "@/lib/lead-activities/lead-activities-service";
import { transitionLeadStageAtomic, type Lead } from "@/lib/leads/leads-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

type OutreachEventInsert = Database["public"]["Tables"]["outreach_events"]["Insert"];
type FunnelStage = Database["public"]["Tables"]["funnel_stages"]["Row"];

export async function sendOutreachAndMoveLead(params: {
  workspaceId: string;
  leadId: string;
  campaignId: string;
  message: string;
}): Promise<Lead> {
  const supabase = getSupabaseBrowserClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const { data: tryingContactStage, error: stageError } = await supabase
    .from("funnel_stages")
    .select("*")
    .eq("workspace_id", params.workspaceId)
    .eq("slug", "trying_contact")
    .single<FunnelStage>();

  if (stageError || !tryingContactStage) {
    throw new Error("Etapa trying_contact não encontrada no workspace.");
  }

  const payload: OutreachEventInsert = {
    workspace_id: params.workspaceId,
    lead_id: params.leadId,
    campaign_id: params.campaignId,
    message: params.message,
    sent_at: new Date().toISOString(),
    user_id: userId,
  };

  const { error: insertError } = await supabase.from("outreach_events").insert(payload);
  if (insertError) {
    throw new Error(insertError.message);
  }

  const updatedLead = await transitionLeadStageAtomic({
    workspace_id: params.workspaceId,
    lead_id: params.leadId,
    destination_stage_id: tryingContactStage.id,
  });

  try {
    await insertOutreachSentActivity({
      workspaceId: params.workspaceId,
      leadId: params.leadId,
      campaignId: params.campaignId,
      messagePreview: params.message,
      createdBy: userId,
    });
  } catch {
    return updatedLead;
  }

  return updatedLead;
}
