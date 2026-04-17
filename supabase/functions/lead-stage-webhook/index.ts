import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  describeInvalidLlmEnv,
  generateMessageVariants,
  isAllowedLlmProvider,
} from "../_shared/llm-messages.ts";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
};

type ClientStagePayload = {
  lead_id: string;
  old_stage_id: string;
  new_stage_id: string;
};

type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          workspace_id: string;
          stage_id: string;
          owner_user_id: string | null;
          full_name: string | null;
          company_name: string | null;
          email: string | null;
          phone: string | null;
          job_title: string | null;
          linkedin_url: string | null;
          source: string | null;
          status: string | null;
          notes: string | null;
          custom_fields: Record<string, unknown> | null;
          updated_at: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          context_markdown: string | null;
          generation_prompt: string;
          is_active: boolean;
          trigger_stage_id: string | null;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
        };
      };
      lead_custom_field_definitions: {
        Row: {
          key: string;
          label: string;
          type: string;
          workspace_id: string;
        };
      };
      lead_message_suggestions: {
        Insert: {
          workspace_id: string;
          lead_id: string;
          campaign_id: string;
          variant_index: number;
          content: string;
          source?: "manual" | "auto_trigger";
        };
      };
      lead_stage_webhook_campaign_dedupe: {
        Row: {
          lead_id: string;
          campaign_id: string;
          old_stage_id: string;
          new_stage_id: string;
          leads_updated_at: string;
          created_at: string;
        };
      };
      generation_jobs: {
        Row: {
          id: string;
          workspace_id: string;
          lead_id: string;
          status: "pending" | "completed" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          lead_id: string;
          status: "pending" | "completed" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "completed" | "failed";
          updated_at?: string;
        };
      };
    };
  };
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function extractBearerToken(headers: Headers): string | null {
  const auth = headers.get("authorization") ?? headers.get("Authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function isClientStagePayload(body: unknown): body is ClientStagePayload {
  if (typeof body !== "object" || body === null) return false;
  const o = body as Record<string, unknown>;
  if ("type" in o) return false;
  if (typeof o.lead_id !== "string" || typeof o.old_stage_id !== "string" || typeof o.new_stage_id !== "string") {
    return false;
  }
  return o.lead_id.length > 0 && o.old_stage_id.length > 0 && o.new_stage_id.length > 0;
}

async function setGenerationJobStatus(
  admin: SupabaseClient<Database>,
  jobId: string | null,
  status: "completed" | "failed"
) {
  if (!jobId) return;
  const iso = new Date().toISOString();
  await admin.from("generation_jobs").update({ status, updated_at: iso }).eq("id", jobId);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function buildPrompt(params: {
  campaign: Database["public"]["Tables"]["campaigns"]["Row"];
  lead: Database["public"]["Tables"]["leads"]["Row"];
  customFieldPairs: Array<{ label: string; key: string; value: unknown }>;
}): string {
  const { campaign, lead, customFieldPairs } = params;
  const standardLines = [
    `Nome: ${lead.full_name ?? "-"}`,
    `Empresa: ${lead.company_name ?? "-"}`,
    `Email: ${lead.email ?? "-"}`,
    `Telefone: ${lead.phone ?? "-"}`,
    `Cargo: ${lead.job_title ?? "-"}`,
    `LinkedIn: ${lead.linkedin_url ?? "-"}`,
    `Origem: ${lead.source ?? "-"}`,
    `Status: ${lead.status ?? "-"}`,
    `Observacoes: ${lead.notes ?? "-"}`,
  ];
  const customLines =
    customFieldPairs.length > 0
      ? customFieldPairs.map((item) => `${item.label}: ${toText(item.value) || "-"}`)
      : ["Sem campos personalizados preenchidos."];

  return [
    "CONTEXTO",
    `Campanha: ${campaign.name}`,
    campaign.context_markdown?.trim() || "Sem contexto adicional.",
    "",
    "INSTRUCOES",
    campaign.generation_prompt.trim(),
    "Gere entre 2 e 3 mensagens curtas para abordagem comercial.",
    "Retorne apenas JSON no formato: {\"messages\": [\"...\", \"...\"]}.",
    "",
    "DADOS DO LEAD",
    ...standardLines,
    "Campos personalizados:",
    ...customLines,
  ].join("\n");
}

async function processStageChangeGeneration(params: {
  admin: SupabaseClient<Database>;
  lead: Database["public"]["Tables"]["leads"]["Row"];
  workspaceId: string;
  leadId: string;
  oldStageId: string;
  newStageId: string;
  provider: string;
  model: string;
  apiKey: string;
}): Promise<Response> {
  const { admin, lead, workspaceId, leadId, oldStageId, newStageId, provider, model, apiKey } =
    params;

  const campaignsQuery = await admin
    .from("campaigns")
    .select("id, workspace_id, name, context_markdown, generation_prompt, is_active, trigger_stage_id")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .eq("trigger_stage_id", newStageId);

  if (campaignsQuery.error) {
    return jsonResponse(
      { error: "campaigns_lookup_failed", detail: campaignsQuery.error.message },
      500
    );
  }

  const campaigns = campaignsQuery.data ?? [];
  if (campaigns.length === 0) {
    return jsonResponse({ processed: true, generated: 0, reason: "no_matching_campaigns" }, 200);
  }

  const defsQuery = await admin
    .from("lead_custom_field_definitions")
    .select("workspace_id, key, label, type")
    .eq("workspace_id", workspaceId);

  if (defsQuery.error) {
    return jsonResponse(
      { error: "custom_fields_lookup_failed", detail: defsQuery.error.message },
      500
    );
  }

  const customObj =
    lead.custom_fields && typeof lead.custom_fields === "object"
      ? (lead.custom_fields as Record<string, unknown>)
      : {};
  const customFieldPairs = (defsQuery.data ?? []).map((def) => ({
    key: def.key,
    label: def.label,
    value: customObj[def.key],
  }));

  await admin.from("generation_jobs").delete().eq("lead_id", leadId).eq("status", "pending");
  const jobInsert = await admin
    .from("generation_jobs")
    .insert({
      workspace_id: workspaceId,
      lead_id: leadId,
      status: "pending",
    })
    .select("id")
    .maybeSingle();
  const jobId = jobInsert.error || !jobInsert.data?.id ? null : jobInsert.data.id;

  let generatedTotal = 0;
  const results: Array<{ campaign_id: string; inserted: number; deduped?: boolean }> = [];

  for (const campaign of campaigns) {
    const dedupeInsert = await admin.from("lead_stage_webhook_campaign_dedupe").insert({
      lead_id: leadId,
      campaign_id: campaign.id,
      old_stage_id: oldStageId,
      new_stage_id: newStageId,
      leads_updated_at: lead.updated_at,
    });

    if (dedupeInsert.error) {
      const code = dedupeInsert.error.code;
      const msg = dedupeInsert.error.message ?? "";
      if (code === "23505" || /duplicate key value/i.test(msg)) {
        results.push({ campaign_id: campaign.id, inserted: 0, deduped: true });
        continue;
      }
      await setGenerationJobStatus(admin, jobId, "failed");
      return jsonResponse(
        { error: "dedupe_insert_failed", detail: dedupeInsert.error.message },
        500
      );
    }

    const prompt = buildPrompt({ campaign, lead, customFieldPairs });
    let messages: string[];
    try {
      messages = await generateMessageVariants({
        provider: provider ?? "",
        apiKey,
        model,
        prompt,
      });
    } catch (err) {
      await admin
        .from("lead_stage_webhook_campaign_dedupe")
        .delete()
        .eq("lead_id", leadId)
        .eq("campaign_id", campaign.id)
        .eq("old_stage_id", oldStageId)
        .eq("new_stage_id", newStageId)
        .eq("leads_updated_at", lead.updated_at);
      const detail = err instanceof Error ? err.message : "llm_unknown_error";
      await setGenerationJobStatus(admin, jobId, "failed");
      return jsonResponse({ error: "generation_failed", campaign_id: campaign.id, detail }, 500);
    }

    const variantQuery = await admin
      .from("lead_message_suggestions")
      .select("variant_index")
      .eq("workspace_id", workspaceId)
      .eq("lead_id", leadId)
      .eq("campaign_id", campaign.id)
      .order("variant_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (variantQuery.error) {
      await setGenerationJobStatus(admin, jobId, "failed");
      return jsonResponse(
        { error: "variant_index_lookup_failed", detail: variantQuery.error.message },
        500
      );
    }

    const currentMax = variantQuery.data?.variant_index ?? 0;
    const rows: Database["public"]["Tables"]["lead_message_suggestions"]["Insert"][] =
      messages.map((content, index) => ({
        workspace_id: workspaceId,
        lead_id: leadId,
        campaign_id: campaign.id,
        content,
        variant_index: currentMax + index + 1,
        source: "auto_trigger",
      }));

    const insertedQuery = await admin
      .from("lead_message_suggestions")
      .insert(rows)
      .select("id");

    if (insertedQuery.error) {
      await admin
        .from("lead_stage_webhook_campaign_dedupe")
        .delete()
        .eq("lead_id", leadId)
        .eq("campaign_id", campaign.id)
        .eq("old_stage_id", oldStageId)
        .eq("new_stage_id", newStageId)
        .eq("leads_updated_at", lead.updated_at);
      await setGenerationJobStatus(admin, jobId, "failed");
      return jsonResponse(
        { error: "suggestions_insert_failed", detail: insertedQuery.error.message },
        500
      );
    }

    const count = insertedQuery.data?.length ?? 0;
    generatedTotal += count;
    results.push({ campaign_id: campaign.id, inserted: count });
  }

  await setGenerationJobStatus(admin, jobId, "completed");
  return jsonResponse({ processed: true, generated: generatedTotal, results }, 200);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json_body" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const provider = Deno.env.get("LLM_PROVIDER");
  const model = Deno.env.get("LLM_MODEL");
  const apiKey = Deno.env.get("LLM_API_KEY");
  const expectedSecret = Deno.env.get("LEAD_STAGE_WEBHOOK_SECRET");
  const headerSecret =
    request.headers.get("x-webhook-secret") ??
    request.headers.get("X-Webhook-Secret");

  if (isClientStagePayload(rawBody)) {
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: "missing_supabase_env" }, 503);
    }
    if (!isAllowedLlmProvider(provider) || !model?.trim() || !apiKey?.trim()) {
      return jsonResponse(
        {
          error: "missing_or_invalid_llm_config",
          detail: describeInvalidLlmEnv(provider, model, apiKey),
        },
        503
      );
    }

    const token = extractBearerToken(request.headers);
    if (!token) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    const authClient = createClient<Database>(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const userResult = await authClient.auth.getUser(token);
    const userId = userResult.data.user?.id;
    if (userResult.error || !userId) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    const { lead_id: leadId, old_stage_id: oldStageId, new_stage_id: newStageId } = rawBody;

    if (newStageId === oldStageId) {
      return jsonResponse({ skipped: true, reason: "stage_unchanged" }, 200);
    }

    const admin = createClient<Database>(supabaseUrl, serviceRoleKey);

    const leadQuery = await admin
      .from("leads")
      .select(
        "id, workspace_id, stage_id, owner_user_id, full_name, company_name, email, phone, job_title, linkedin_url, source, status, notes, custom_fields, updated_at"
      )
      .eq("id", leadId)
      .maybeSingle();

    if (leadQuery.error) {
      return jsonResponse({ error: "lead_lookup_failed", detail: leadQuery.error.message }, 500);
    }
    if (!leadQuery.data) {
      return jsonResponse({ error: "lead_not_found" }, 404);
    }

    const lead = leadQuery.data;
    const workspaceId = lead.workspace_id;

    const memberQuery = await admin
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberQuery.error) {
      return jsonResponse(
        { error: "membership_lookup_failed", detail: memberQuery.error.message },
        500
      );
    }
    if (!memberQuery.data) {
      return jsonResponse({ error: "forbidden" }, 403);
    }

    if (lead.stage_id !== newStageId) {
      return jsonResponse({ skipped: true, reason: "record_not_current" }, 200);
    }

    return await processStageChangeGeneration({
      admin,
      lead,
      workspaceId,
      leadId,
      oldStageId,
      newStageId,
      provider: provider ?? "",
      model,
      apiKey,
    });
  }

  const payload = rawBody as WebhookPayload;

  if (!expectedSecret) {
    return jsonResponse({ error: "webhook_secret_not_configured" }, 503);
  }
  if (!headerSecret) {
    return jsonResponse({ error: "missing_webhook_secret" }, 401);
  }
  if (headerSecret !== expectedSecret) {
    return jsonResponse({ error: "invalid_webhook_secret" }, 403);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "missing_supabase_env" }, 503);
  }
  if (!isAllowedLlmProvider(provider) || !model?.trim() || !apiKey?.trim()) {
    return jsonResponse(
      {
        error: "missing_or_invalid_llm_config",
        detail: describeInvalidLlmEnv(provider, model, apiKey),
      },
      503
    );
  }

  if (payload.type === "INSERT") {
    return jsonResponse({ skipped: true, reason: "insert_not_handled" }, 200);
  }

  if (payload.type !== "UPDATE" || payload.table !== "leads") {
    return jsonResponse({ skipped: true, reason: "unsupported_event" }, 200);
  }

  const record = payload.record ?? null;
  const oldRecord = payload.old_record ?? null;
  if (!record || !oldRecord) {
    return jsonResponse({ error: "missing_record_or_old_record" }, 400);
  }

  const newStageId = readString(record.stage_id);
  const oldStageId = readString(oldRecord.stage_id);
  const leadId = readString(record.id);
  const workspaceId = readString(record.workspace_id);

  if (!leadId || !workspaceId || !newStageId || !oldStageId) {
    return jsonResponse({ error: "missing_required_fields" }, 400);
  }

  if (newStageId === oldStageId) {
    return jsonResponse({ skipped: true, reason: "stage_unchanged" }, 200);
  }

  const admin = createClient<Database>(supabaseUrl, serviceRoleKey);

  const leadQuery = await admin
    .from("leads")
    .select(
      "id, workspace_id, stage_id, owner_user_id, full_name, company_name, email, phone, job_title, linkedin_url, source, status, notes, custom_fields, updated_at"
    )
    .eq("id", leadId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (leadQuery.error) {
    return jsonResponse({ error: "lead_lookup_failed", detail: leadQuery.error.message }, 500);
  }
  if (!leadQuery.data) {
    return jsonResponse({ error: "lead_not_found" }, 404);
  }
  const lead = leadQuery.data;
  if (lead.stage_id !== newStageId) {
    return jsonResponse({ skipped: true, reason: "record_not_current" }, 200);
  }

  return await processStageChangeGeneration({
    admin,
    lead,
    workspaceId,
    leadId,
    oldStageId,
    newStageId,
    provider: provider ?? "",
    model,
    apiKey,
  });
});
