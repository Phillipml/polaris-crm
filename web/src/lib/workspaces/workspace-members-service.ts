import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Database } from "@/lib/supabase/database.types";

export type WorkspaceMember =
  Database["public"]["Tables"]["workspace_members"]["Row"];

export async function listWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
