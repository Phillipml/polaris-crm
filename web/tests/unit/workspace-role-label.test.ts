import { workspaceRoleLabel } from "@/lib/workspaces/workspace-role-label";

describe("workspaceRoleLabel", () => {
  it("mapeia owner para Administrador", () => {
    expect(workspaceRoleLabel("owner")).toBe("Administrador");
  });

  it("mapeia admin para Administrador", () => {
    expect(workspaceRoleLabel("admin")).toBe("Administrador");
  });

  it("mapeia member para Membro", () => {
    expect(workspaceRoleLabel("member")).toBe("Membro");
  });

  it("retorna valor bruto para papel desconhecido", () => {
    expect(workspaceRoleLabel("guest")).toBe("guest");
  });
});
