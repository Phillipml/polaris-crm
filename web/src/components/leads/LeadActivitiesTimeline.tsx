import type { ReactNode } from "react";
import type { LeadActivity } from "@/lib/lead-activities/lead-activities-service";
import type { FunnelStage } from "@/lib/funnel-stages/funnel-stages-service";
import type { Json } from "@/lib/supabase/database.types";

type CampaignOption = { id: string; name: string };

const FIELD_LABELS: Record<string, string> = {
  full_name: "Nome",
  company_name: "Empresa",
  email: "E-mail",
  phone: "Telefone",
  job_title: "Cargo",
  linkedin_url: "LinkedIn",
  source: "Origem",
  status: "Status",
  owner_user_id: "Responsável",
  notes: "Observações",
  custom_fields: "Campos personalizados",
};

function isRecord(value: Json): value is Record<string, Json> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stageName(
  stages: FunnelStage[],
  stageId: Json | undefined
): string | null {
  if (typeof stageId !== "string" || !stageId) {
    return null;
  }
  const row = stages.find((s) => s.id === stageId);
  return row?.name ?? null;
}

function campaignName(
  campaigns: CampaignOption[],
  campaignId: Json | undefined
): string | null {
  if (typeof campaignId !== "string" || !campaignId) {
    return null;
  }
  const row = campaigns.find((c) => c.id === campaignId);
  return row?.name ?? null;
}

function actorLabel(createdBy: string | null, currentUserId: string | null): string {
  if (!createdBy) {
    return "Sistema";
  }
  if (currentUserId && createdBy === currentUserId) {
    return "Você";
  }
  return `Usuário ${createdBy.slice(0, 8)}…`;
}

function formatScalar(value: Json): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

export function LeadActivitiesTimeline(props: {
  activities: LeadActivity[];
  isLoading: boolean;
  error: string | null;
  currentUserId: string | null;
  stages: FunnelStage[];
  campaigns: CampaignOption[];
}) {
  return (
    <aside className="space-y-4 rounded-xl border border-(--border) bg-(--surface-hover)/20 p-4 lg:sticky lg:top-24 lg:self-start">
      <div>
        <h2 className="text-base font-semibold text-text">Atividades</h2>
        <p className="mt-1 text-xs text-(--text-muted)">
          Mudanças de etapa, edições e envios simulados registrados neste lead.
        </p>
      </div>
      {props.isLoading ? (
        <p className="text-sm text-(--text-muted)">Carregando…</p>
      ) : null}
      {props.error ? (
        <p className="text-sm font-medium text-red-500">{props.error}</p>
      ) : null}
      {!props.isLoading && !props.error && props.activities.length === 0 ? (
        <p className="text-sm text-(--text-muted)">Nenhuma atividade ainda.</p>
      ) : null}
      {!props.isLoading && props.activities.length > 0 ? (
        <ul className="relative space-y-0 border-l border-(--border) pl-4">
          {props.activities.map((item) => (
            <li key={item.id} className="relative pb-6 last:pb-0">
              <span
                className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-(--primary)"
                aria-hidden
              />
              <div className="ml-2.5">
                <p className="text-xs text-(--text-muted)">
                  {new Date(item.created_at).toLocaleString("pt-BR")} ·{" "}
                  {actorLabel(item.created_by, props.currentUserId)}
                </p>
                <p className="mt-1 text-sm font-medium text-text">
                  {titleForActivity(item)}
                </p>
                <div className="mt-1 text-xs leading-relaxed text-(--text-muted)">
                  {bodyForActivity(item, props.stages, props.campaigns)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

function titleForActivity(item: LeadActivity): string {
  if (item.type === "stage_changed") {
    return "Etapa alterada";
  }
  if (item.type === "fields_updated") {
    return "Campos atualizados";
  }
  if (item.type === "outreach_sent") {
    return "Envio simulado";
  }
  return item.type;
}

function bodyForActivity(
  item: LeadActivity,
  stages: FunnelStage[],
  campaigns: CampaignOption[]
): ReactNode {
  const payload = item.payload;

  if (item.type === "stage_changed" && isRecord(payload)) {
    const prevName =
      stageName(stages, payload.previous_stage_id) ??
      (typeof payload.previous_stage_id === "string"
        ? payload.previous_stage_id.slice(0, 8)
        : "—");
    const nextName =
      stageName(stages, payload.new_stage_id) ??
      (typeof payload.new_stage_id === "string"
        ? payload.new_stage_id.slice(0, 8)
        : "—");
    return (
      <span>
        De <span className="font-medium text-text">{prevName}</span> para{" "}
        <span className="font-medium text-text">{nextName}</span>
      </span>
    );
  }

  if (item.type === "outreach_sent" && isRecord(payload)) {
    const cname =
      campaignName(campaigns, payload.campaign_id) ??
      (typeof payload.campaign_id === "string"
        ? payload.campaign_id.slice(0, 8)
        : "—");
    const preview =
      typeof payload.message_preview === "string"
        ? payload.message_preview
        : "";
    return (
      <div className="space-y-1">
        <p>
          Campanha: <span className="font-medium text-text">{cname}</span>
        </p>
        {preview ? (
          <p className="whitespace-pre-wrap rounded-md bg-(--surface-hover)/40 p-2 text-text">
            {preview}
          </p>
        ) : null}
      </div>
    );
  }

  if (item.type === "fields_updated" && isRecord(payload)) {
    const raw = payload.changes;
    if (!isRecord(raw)) {
      return null;
    }
    return (
      <ul className="list-inside list-disc space-y-1">
        {Object.keys(raw).map((key) => {
          const label = FIELD_LABELS[key] ?? key;
          const pair = raw[key];
          if (!isRecord(pair)) {
            return (
              <li key={key}>
                {label}
              </li>
            );
          }
          return (
            <li key={key}>
              <span className="font-medium text-text">{label}</span>:{" "}
              <span className="line-through opacity-70">
                {formatScalar(pair.before as Json)}
              </span>{" "}
              → {formatScalar(pair.after as Json)}
            </li>
          );
        })}
      </ul>
    );
  }

  return null;
}
