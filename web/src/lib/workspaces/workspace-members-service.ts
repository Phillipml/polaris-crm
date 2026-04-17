import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export type WorkspaceMember = {
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
  email: string | null;
};

type RpcClient = {
  rpc: (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

function parseWorkspaceMembersPayload(raw: unknown): WorkspaceMember[] {
  if (raw == null) {
    return [];
  }
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  const out: WorkspaceMember[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    const workspace_id = String(row.workspace_id ?? "");
    const user_id = String(row.user_id ?? "");
    const role = String(row.role ?? "");
    const created_at = String(row.created_at ?? "");
    const email =
      row.email === null || row.email === undefined
        ? null
        : String(row.email);
    if (!workspace_id || !user_id) {
      continue;
    }
    out.push({ workspace_id, user_id, role, created_at, email });
  }
  return out;
}

export async function listWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const supabase = getSupabaseBrowserClient();
  const rpcClient = supabase as unknown as RpcClient;
  const { data, error } = await rpcClient.rpc(
    "list_workspace_members_for_assignee",
    { p_workspace: workspaceId }
  );

  if (error) {
    throw new Error(error.message);
  }

  return parseWorkspaceMembersPayload(data);
}
