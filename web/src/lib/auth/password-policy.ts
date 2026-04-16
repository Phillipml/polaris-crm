export const PASSWORD_POLICY_HINT_PT =
  "Mínimo de 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.";

export function getPasswordPolicyError(password: string): string | null {
  if (password.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Inclua pelo menos uma letra maiúscula.";
  }
  if (!/[a-z]/.test(password)) {
    return "Inclua pelo menos uma letra minúscula.";
  }
  if (!/[0-9]/.test(password)) {
    return "Inclua pelo menos um número.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Inclua pelo menos um caractere especial.";
  }
  return null;
}
