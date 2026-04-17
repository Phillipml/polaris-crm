"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { FunnelStage } from "@/lib/funnel-stages/funnel-stages-service";

const inputClass =
  "w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25";
const textareaClass =
  "w-full min-h-[220px] resize-y rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm leading-relaxed outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25";

export type CampaignFormValues = {
  name: string;
  channel: string;
  description: string;
  context_markdown: string;
  generation_prompt: string;
  is_active: boolean;
  trigger_stage_id: string | null;
};

type CampaignFormProps = {
  stages: FunnelStage[];
  initialValues?: Partial<CampaignFormValues>;
  submitLabel: string;
  isSubmitting: boolean;
  formError: string | null;
  onSubmit: (values: CampaignFormValues) => Promise<void>;
};

export function CampaignForm({
  stages,
  initialValues,
  submitLabel,
  isSubmitting,
  formError,
  onSubmit,
}: CampaignFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [channel, setChannel] = useState(initialValues?.channel ?? "email");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [contextMarkdown, setContextMarkdown] = useState(
    initialValues?.context_markdown ?? ""
  );
  const [generationPrompt, setGenerationPrompt] = useState(
    initialValues?.generation_prompt ?? ""
  );
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true);
  const [triggerStageId, setTriggerStageId] = useState(
    initialValues?.trigger_stage_id ?? ""
  );

  useEffect(() => {
    if (!initialValues) return;
    setName(initialValues.name ?? "");
    setChannel(initialValues.channel ?? "email");
    setDescription(initialValues.description ?? "");
    setContextMarkdown(initialValues.context_markdown ?? "");
    setGenerationPrompt(initialValues.generation_prompt ?? "");
    setIsActive(initialValues.is_active ?? true);
    setTriggerStageId(initialValues.trigger_stage_id ?? "");
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      name: name.trim(),
      channel,
      description: description.trim(),
      context_markdown: contextMarkdown,
      generation_prompt: generationPrompt,
      is_active: isActive,
      trigger_stage_id: triggerStageId.trim() === "" ? null : triggerStageId,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <label htmlFor="campaign-name" className="text-sm font-medium text-text">
          Nome
        </label>
        <input
          id="campaign-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          autoComplete="off"
          className={inputClass}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="campaign-channel"
          className="text-sm font-medium text-text"
        >
          Canal
        </label>
        <select
          id="campaign-channel"
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          className={inputClass}
        >
          <option value="email">E-mail</option>
          <option value="linkedin">LinkedIn</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="campaign-description"
          className="text-sm font-medium text-text"
        >
          Descrição curta (opcional)
        </label>
        <textarea
          id="campaign-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className={textareaClass + " min-h-[72px]"}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-(--border) bg-(--surface-hover)/30 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-text">Campanha ativa</p>
          <p className="text-xs text-(--text-muted)">
            Inativa não entra em fluxos automáticos futuros.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive((current) => !current)}
          className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary) ${
            isActive ? "bg-(--primary)" : "bg-(--surface-hover)"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 translate-x-1 rounded-full bg-white shadow transition-transform ${
              isActive ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="grid gap-2">
        <label htmlFor="campaign-trigger-stage" className="text-sm font-medium text-text">
          Etapa gatilho
        </label>
        <select
          id="campaign-trigger-stage"
          value={triggerStageId}
          onChange={(event) => setTriggerStageId(event.target.value)}
          className={`${inputClass} max-w-md`}
        >
          <option value="">Nenhuma (sem disparo automático ao mudar etapa)</option>
          {triggerStageId &&
          triggerStageId.trim() !== "" &&
          !stages.some((s) => s.id === triggerStageId) ? (
            <option value={triggerStageId}>
              Etapa salva (não listada no funil atual)
            </option>
          ) : null}
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-(--text-muted)">
          Com campanha ativa, ao mover o lead para esta etapa no funil o sistema pode gerar
          sugestões automaticamente (Edge e webhook configurados no Supabase).
        </p>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="campaign-context"
          className="text-sm font-medium text-text"
        >
          Contexto (Markdown)
        </label>
        <textarea
          id="campaign-context"
          value={contextMarkdown}
          onChange={(event) => setContextMarkdown(event.target.value)}
          placeholder="Oferta, público, objeções, tom de voz..."
          className={textareaClass}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="campaign-prompt"
          className="text-sm font-medium text-text"
        >
          Prompt de geração
        </label>
        <textarea
          id="campaign-prompt"
          value={generationPrompt}
          onChange={(event) => setGenerationPrompt(event.target.value)}
          placeholder="Instruções para o modelo: formato das mensagens, persona, variáveis do lead..."
          className={textareaClass}
        />
      </div>

      {formError ? (
        <p className="text-sm font-medium text-red-500">{formError}</p>
      ) : null}

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
