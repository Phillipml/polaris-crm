export function workspaceRoleLabel(role: string): string {
  if (role === "owner" || role === "admin") {
    return "Administrador";
  }
  if (role === "member") {
    return "Membro";
  }
  return role;
}
