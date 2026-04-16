export function getAuthErrorMessage(errorMessage?: string): string {
  if (!errorMessage) {
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  const normalized = errorMessage.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("email not confirmed")
  ) {
    return "Credenciais inválidas. Verifique e-mail e senha.";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered")
  ) {
    return "Este e-mail já está em uso.";
  }

  if (normalized.includes("password should be at least")) {
    return "A senha deve atender à política mínima (8 caracteres e complexidade).";
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("weak") ||
      normalized.includes("requirements") ||
      normalized.includes("strength") ||
      normalized.includes("complexity"))
  ) {
    return "A senha não atende às regras exigidas. Use 8+ caracteres com maiúscula, minúscula, número e caractere especial.";
  }

  if (
    normalized.includes("invalid token") ||
    normalized.includes("token has expired") ||
    normalized.includes("otp expired") ||
    normalized.includes("email link is invalid") ||
    normalized.includes("flow state has expired")
  ) {
    return "Código ou link inválido ou expirado. Solicite um novo envio em Esqueci minha senha.";
  }

  if (normalized.includes("unable to validate email address")) {
    return "Informe um e-mail válido.";
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}
