export const STANDARD_LEAD_FIELD_LABELS: Record<string, string> = {
  full_name: "Nome",
  company_name: "Empresa",
  email: "E-mail",
  phone: "Telefone",
  job_title: "Cargo",
  linkedin_url: "LinkedIn",
  source: "Origem",
  status: "Status",
  notes: "Notas",
  owner_user_id: "Responsável",
};

export function humanizeMissingRequirementToken(
  token: string,
  customKeyToLabel: Record<string, string> = {}
): string {
  const separator = token.indexOf(":");
  if (separator <= 0 || separator === token.length - 1) {
    return token;
  }
  const kind = token.slice(0, separator);
  const key = token.slice(separator + 1);
  if (kind === "standard") {
    return STANDARD_LEAD_FIELD_LABELS[key] ?? key;
  }
  if (kind === "custom") {
    return customKeyToLabel[key] ?? `Campo personalizado (${key})`;
  }
  return token;
}
