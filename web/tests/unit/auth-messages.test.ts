import { getAuthErrorMessage } from "@/lib/auth/messages";

describe("getAuthErrorMessage", () => {
  it("retorna fallback para mensagem vazia", () => {
    expect(getAuthErrorMessage()).toBe(
      "Não foi possível concluir a operação. Tente novamente."
    );
  });

  it("mapeia erro de credenciais inválidas", () => {
    expect(getAuthErrorMessage("Invalid login credentials")).toBe(
      "Credenciais inválidas. Verifique e-mail e senha."
    );
  });

  it("mapeia e-mail já registrado", () => {
    expect(getAuthErrorMessage("User already registered")).toBe(
      "Este e-mail já está em uso."
    );
  });

  it("mapeia política de senha mínima", () => {
    expect(getAuthErrorMessage("Password should be at least 8 characters")).toBe(
      "A senha deve atender à política mínima (8 caracteres e complexidade)."
    );
  });

  it("mapeia força de senha", () => {
    expect(getAuthErrorMessage("password weak complexity")).toBe(
      "A senha não atende às regras exigidas. Use 8+ caracteres com maiúscula, minúscula, número e caractere especial."
    );
  });

  it("mapeia token inválido", () => {
    expect(getAuthErrorMessage("Invalid token")).toBe(
      "Código ou link inválido ou expirado. Solicite um novo envio em Esqueci minha senha."
    );
  });

  it("mapeia e-mail inválido", () => {
    expect(getAuthErrorMessage("Unable to validate email address")).toBe(
      "Informe um e-mail válido."
    );
  });

  it("mapeia relação ausente de workspaces", () => {
    expect(
      getAuthErrorMessage('relation "workspace_members" does not exist')
    ).toBe(
      "Estrutura de workspace não encontrada no banco local. Rode as migrações do Supabase e tente novamente."
    );
  });

  it("mapeia relação ausente para tabela workspaces", () => {
    expect(getAuthErrorMessage('relation "workspaces" does not exist')).toBe(
      "Estrutura de workspace não encontrada no banco local. Rode as migrações do Supabase e tente novamente."
    );
  });

  it("mapeia função ausente de delete workspace", () => {
    expect(
      getAuthErrorMessage(
        'function public.delete_workspace_as_owner(uuid) does not exist'
      )
    ).toBe(
      "A função de apagar workspace ainda não está no banco. Aplique as migrações do Supabase e tente novamente."
    );
  });

  it("mapeia erro de permissão", () => {
    expect(getAuthErrorMessage("forbidden workspace")).toBe(
      "Sua sessão não tem permissão para esta ação. Entre novamente e tente criar o workspace."
    );
  });

  it("mapeia erro de sessão jwt", () => {
    expect(getAuthErrorMessage("jwt expired")).toBe(
      "Sua sessão não tem permissão para esta ação. Entre novamente e tente criar o workspace."
    );
  });

  it("mantém fallback para erro desconhecido", () => {
    expect(getAuthErrorMessage("erro inesperado xyz")).toBe(
      "Não foi possível concluir a operação. Tente novamente."
    );
  });
});
