import { workspaceRoleLabel } from "@/lib/workspaces/workspace-role-label";

export function emailLocalPartForDisplay(
  email: string | null | undefined
): string | null {
  if (!email) {
    return null;
  }
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) {
    return null;
  }
  return trimmed.slice(0, at);
}

export function memberAssigneeOptionLabel(
  userId: string,
  email: string | null | undefined,
  role: string
): string {
  const local = emailLocalPartForDisplay(email);
  const name = local ?? userId.slice(0, 8);
  const rolePt = workspaceRoleLabel(role).toLowerCase();
  return `${name}(${rolePt})`;
}
