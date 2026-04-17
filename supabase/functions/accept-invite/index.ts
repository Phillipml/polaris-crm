import { createClient } from "@supabase/supabase-js";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

function extractBearerToken(headers: Headers): string | null {
  const auth = headers.get("authorization") ?? headers.get("Authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

type AcceptBody = {
  token?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const bearer = extractBearerToken(request.headers);
  if (!bearer) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "missing_supabase_env" }, 503);
  }

  let body: AcceptBody;
  try {
    body = (await request.json()) as AcceptBody;
  } catch {
    return jsonResponse({ error: "invalid_json_body" }, 400);
  }

  const rawToken = typeof body.token === "string" ? body.token.trim() : "";
  if (!rawToken) {
    return jsonResponse({ error: "token_required" }, 400);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  });

  const userResult = await authClient.auth.getUser(bearer);
  const userId = userResult.data.user?.id;
  const userEmail = userResult.data.user?.email?.trim().toLowerCase() ?? "";
  if (userResult.error || !userId || !userEmail) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const inviteRes = await admin
    .from("workspace_invites")
    .select("id, workspace_id, email, role, expires_at, accepted_at")
    .eq("token", rawToken)
    .maybeSingle();

  if (inviteRes.error) {
    return jsonResponse(
      { error: "invite_lookup_failed", detail: inviteRes.error.message },
      500
    );
  }

  const invite = inviteRes.data;
  if (!invite) {
    return jsonResponse({ error: "invite_not_found" }, 200);
  }

  if (invite.accepted_at) {
    return jsonResponse({ error: "invite_already_used" }, 200);
  }

  const expiresAt = new Date(String(invite.expires_at)).getTime();
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    return jsonResponse({ error: "invite_expired" }, 200);
  }

  const inviteEmail = String(invite.email).trim().toLowerCase();
  if (inviteEmail !== userEmail) {
    return jsonResponse({ error: "invite_email_mismatch" }, 200);
  }

  const role = invite.role as string;
  if (role !== "admin" && role !== "member") {
    return jsonResponse({ error: "invite_invalid_role" }, 200);
  }

  const workspaceId = String(invite.workspace_id);

  const existing = await admin
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    return jsonResponse(
      { error: "membership_lookup_failed", detail: existing.error.message },
      500
    );
  }

  if (existing.data) {
    const mark = await admin
      .from("workspace_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id)
      .is("accepted_at", null);
    if (mark.error) {
      return jsonResponse(
        { error: "invite_update_failed", detail: mark.error.message },
        500
      );
    }
    return jsonResponse({
      workspace_id: workspaceId,
      role: String(existing.data.role),
      already_member: true,
    });
  }

  const insertRes = await admin.from("workspace_members").insert({
    workspace_id: workspaceId,
    user_id: userId,
    role,
  });

  if (insertRes.error) {
    return jsonResponse(
      { error: "membership_insert_failed", detail: insertRes.error.message },
      500
    );
  }

  const markUsed = await admin
    .from("workspace_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id)
    .is("accepted_at", null);

  if (markUsed.error) {
    return jsonResponse(
      { error: "invite_update_failed", detail: markUsed.error.message },
      500
    );
  }

  return jsonResponse({
    workspace_id: workspaceId,
    role,
    already_member: false,
  });
});
