import { createClient } from "@supabase/supabase-js";

type GenerateRequestBody = {
  campaign_id?: string;
  lead_id?: string;
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
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: string;
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
    };
  };
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function extractBearerToken(headers: Headers): string | null {
  const auth = headers.get("authorization") ?? headers.get("Authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
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

function parseGeneratedMessages(rawText: string): string[] | null {
  try {
    const parsed = JSON.parse(rawText) as { messages?: unknown };
    if (!Array.isArray(parsed.messages)) {
      return null;
    }
    const cleaned = parsed.messages
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (cleaned.length < 2 || cleaned.length > 3) {
      return null;
    }
    return cleaned;
  } catch {
    return null;
  }
}

async function generateWithGemini(params: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<string[]> {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(params.model)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: params.prompt }] }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              minItems: 2,
              maxItems: 3,
              items: { type: "string" },
            },
          },
          required: ["messages"],
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`llm_request_failed:${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = parseGeneratedMessages(raw);
  if (!parsed) {
    throw new Error("llm_invalid_output");
  }
  return parsed;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const token = extractBearerToken(request.headers);
  if (!token) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const provider = Deno.env.get("LLM_PROVIDER");
  const model = Deno.env.get("LLM_MODEL");
  const apiKey = Deno.env.get("LLM_API_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "missing_supabase_env" }, 503);
  }
  if (provider !== "google" || !model || !apiKey) {
    return jsonResponse({ error: "missing_or_invalid_llm_config" }, 503);
  }

  const authClient = createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const userResult = await authClient.auth.getUser(token);
  const userId = userResult.data.user?.id;
  if (userResult.error || !userId) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  let body: GenerateRequestBody;
  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return jsonResponse({ error: "invalid_json_body" }, 400);
  }

  if (!body.lead_id || !body.campaign_id) {
    return jsonResponse({ error: "lead_id_and_campaign_id_required" }, 400);
  }

  const admin = createClient<Database>(supabaseUrl, serviceRoleKey);

  const leadQuery = await admin
    .from("leads")
    .select(
      "id, workspace_id, stage_id, owner_user_id, full_name, company_name, email, phone, job_title, linkedin_url, source, status, notes, custom_fields"
    )
    .eq("id", body.lead_id)
    .maybeSingle();

  if (leadQuery.error) {
    return jsonResponse({ error: "lead_lookup_failed", detail: leadQuery.error.message }, 500);
  }
  if (!leadQuery.data) {
    return jsonResponse({ error: "lead_not_found" }, 404);
  }
  const lead = leadQuery.data;

  const membershipQuery = await admin
    .from("workspace_members")
    .select("workspace_id, user_id, role")
    .eq("workspace_id", lead.workspace_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipQuery.error) {
    return jsonResponse(
      { error: "membership_lookup_failed", detail: membershipQuery.error.message },
      500
    );
  }
  if (!membershipQuery.data) {
    return jsonResponse({ error: "forbidden_workspace" }, 403);
  }

  const campaignQuery = await admin
    .from("campaigns")
    .select("id, workspace_id, name, context_markdown, generation_prompt, is_active")
    .eq("id", body.campaign_id)
    .eq("workspace_id", lead.workspace_id)
    .maybeSingle();

  if (campaignQuery.error) {
    return jsonResponse(
      { error: "campaign_lookup_failed", detail: campaignQuery.error.message },
      500
    );
  }
  if (!campaignQuery.data) {
    return jsonResponse({ error: "campaign_not_found" }, 404);
  }
  const campaign = campaignQuery.data;

  const defsQuery = await admin
    .from("lead_custom_field_definitions")
    .select("workspace_id, key, label, type")
    .eq("workspace_id", lead.workspace_id);

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

  const prompt = buildPrompt({ campaign, lead, customFieldPairs });

  try {
    const messages = await generateWithGemini({
      apiKey,
      model,
      prompt,
    });
    return jsonResponse({ messages });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "llm_unknown_error";
    return jsonResponse({ error: "generation_failed", detail }, 502);
  }
});
