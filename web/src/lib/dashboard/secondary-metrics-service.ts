import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export type CampaignMessageCount = {
  campaignId: string;
  total: number;
};

export async function listCampaignMessageCounts(params: {
  workspaceId: string;
}): Promise<CampaignMessageCount[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("outreach_events")
    .select("campaign_id")
    .eq("workspace_id", params.workspaceId);

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const current = counts.get(row.campaign_id) ?? 0;
    counts.set(row.campaign_id, current + 1);
  }

  return [...counts.entries()]
    .map(([campaignId, total]) => ({ campaignId, total }))
    .sort((a, b) => b.total - a.total);
}
