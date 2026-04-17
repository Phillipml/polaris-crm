import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database, Json } from "@/lib/supabase/database.types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadActivityInsert = Database["public"]["Tables"]["lead_activities"]["Insert"];
type LeadActivityRow = Database["public"]["Tables"]["lead_activities"]["Row"];

export type LeadActivity = LeadActivityRow;

const TRACKED_KEYS: (keyof LeadRow)[] = [
  "full_name",
  "company_name",
  "email",
  "phone",
  "job_title",
  "linkedin_url",
  "source",
  "status",
  "owner_user_id",
  "notes",
  "custom_fields",
];

const PAYLOAD_MAX = 800;

function stableJson(value: Json | null | undefined): string {
  if (value === null || value === undefined) {
    return "null";
  }
  return JSON.stringify(value);
}

function clipText(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
}

function toPayloadScalar(value: unknown): Json {
  if (value === null || value === undefined) {
    return null;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return clipText(stableJson(value as Json), PAYLOAD_MAX);
}

function fieldChanged(before: LeadRow, after: LeadRow, key: keyof LeadRow): boolean {
  if (key === "custom_fields") {
    return stableJson(before.custom_fields as Json) !== stableJson(after.custom_fields as Json);
  }
  return before[key] !== after[key];
}

export async function listLeadActivities(params: {
  workspaceId: string;
  leadId: string;
}): Promise<LeadActivity[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("workspace_id", params.workspaceId)
    .eq("lead_id", params.leadId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function insertOutreachSentActivity(params: {
  workspaceId: string;
  leadId: string;
  campaignId: string;
  messagePreview: string;
  createdBy: string | null;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const row: LeadActivityInsert = {
    workspace_id: params.workspaceId,
    lead_id: params.leadId,
    type: "outreach_sent",
    payload: {
      campaign_id: params.campaignId,
      message_preview: clipText(params.messagePreview, 400),
    },
    created_by: params.createdBy,
  };

  const { error } = await supabase.from("lead_activities").insert(row);
  if (error) {
    throw new Error(error.message);
  }
}

export async function recordFieldsUpdatedActivityIfNeeded(params: {
  supabase: SupabaseClient<Database>;
  workspaceId: string;
  leadId: string;
  before: LeadRow;
  after: LeadRow;
}): Promise<void> {
  const changes: Record<string, { before: Json; after: Json }> = {};

  for (const key of TRACKED_KEYS) {
    if (!fieldChanged(params.before, params.after, key)) {
      continue;
    }
    changes[key] = {
      before: toPayloadScalar(params.before[key]),
      after: toPayloadScalar(params.after[key]),
    };
  }

  if (Object.keys(changes).length === 0) {
    return;
  }

  const { data: userData } = await params.supabase.auth.getUser();
  const createdBy = userData.user?.id ?? null;

  const row: LeadActivityInsert = {
    workspace_id: params.workspaceId,
    lead_id: params.leadId,
    type: "fields_updated",
    payload: { changes },
    created_by: createdBy,
  };

  const { error } = await params.supabase.from("lead_activities").insert(row);
  if (error) {
    throw new Error(error.message);
  }
}
