import {
  emailLocalPartForDisplay,
  memberAssigneeOptionLabel,
} from "@/lib/workspaces/member-assignee-label";

describe("emailLocalPartForDisplay", () => {
  it("retorna parte antes do @", () => {
    expect(emailLocalPartForDisplay("phillip.loureiro@empresa.com")).toBe(
      "phillip.loureiro"
    );
  });

  it("retorna null para vazio", () => {
    expect(emailLocalPartForDisplay("")).toBeNull();
    expect(emailLocalPartForDisplay(null)).toBeNull();
  });

  it("retorna null se não houver @", () => {
    expect(emailLocalPartForDisplay("semarroba")).toBeNull();
  });
});

describe("memberAssigneeOptionLabel", () => {
  it("usa local do e-mail e papel em minúsculas", () => {
    expect(
      memberAssigneeOptionLabel("uuid-1", "amelie.maria@x.com", "member")
    ).toBe("amelie.maria(membro)");
  });

  it("cai no prefixo do id sem e-mail", () => {
    expect(memberAssigneeOptionLabel("abcdef12-0000-0000-0000-000000000000", null, "owner")).toBe(
      "abcdef12(administrador)"
    );
  });
});
