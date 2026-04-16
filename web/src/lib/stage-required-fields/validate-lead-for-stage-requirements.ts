import type { StageRequiredField } from "./stage-required-fields-service";

export type LeadSnapshotForRequirements = {
  full_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  source: string | null;
  status: string | null;
  notes: string | null;
  owner_user_id: string | null;
  custom_fields: Record<string, unknown>;
};

const STANDARD_STRING_KEYS = new Set([
  "full_name",
  "company_name",
  "email",
  "phone",
  "job_title",
  "linkedin_url",
  "source",
  "status",
  "notes",
]);

function isStandardStringMissing(value: string | null | undefined): boolean {
  return (value ?? "").trim() === "";
}

function isCustomValueMissing(
  customFields: Record<string, unknown>,
  key: string
): boolean {
  if (!Object.prototype.hasOwnProperty.call(customFields, key)) {
    return true;
  }
  const raw = customFields[key];
  if (raw === null || raw === undefined) {
    return true;
  }
  if (typeof raw === "string") {
    return raw.trim() === "";
  }
  if (typeof raw === "number" || typeof raw === "boolean") {
    return false;
  }
  if (typeof raw === "object") {
    return false;
  }
  return true;
}

export function listMissingStageRequirements(
  requirements: StageRequiredField[],
  snapshot: LeadSnapshotForRequirements
): string[] {
  const missing: string[] = [];
  for (const req of requirements) {
    const token = `${req.field_kind}:${req.field_key}`;
    if (req.field_kind === "standard") {
      const key = req.field_key;
      if (key === "owner_user_id") {
        if (snapshot.owner_user_id === null || snapshot.owner_user_id === "") {
          missing.push(token);
        }
        continue;
      }
      if (!STANDARD_STRING_KEYS.has(key)) {
        missing.push(token);
        continue;
      }
      const column = snapshot[key as keyof LeadSnapshotForRequirements];
      const str =
        typeof column === "string" || column === null || column === undefined
          ? (column as string | null | undefined)
          : null;
      if (isStandardStringMissing(str)) {
        missing.push(token);
      }
      continue;
    }
    if (req.field_kind === "custom") {
      if (isCustomValueMissing(snapshot.custom_fields, req.field_key)) {
        missing.push(token);
      }
      continue;
    }
    missing.push(token);
  }
  return missing;
}

export function formatMissingRequirementsMessage(missing: string[]): string {
  if (missing.length === 0) {
    return "";
  }
  return `Campos obrigatórios faltando: ${missing.join(", ")}`;
}
