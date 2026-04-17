"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WORKSPACE_STORAGE_KEY } from "@/hooks/use-resolved-workspace-id";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

function buildLoginHref(token: string): string {
  const next = `/accept-invite?token=${encodeURIComponent(token)}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

const linkButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [phase, setPhase] = useState<
    "idle" | "need_login" | "busy" | "done" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("token");
    setToken(raw?.trim() ? raw.trim() : "");
  }, []);

  useEffect(() => {
    if (token === null) {
      return;
    }
    if (token === "") {
      setPhase("error");
      setMessage("Link de convite inválido: token ausente.");
      return;
    }

    let cancelled = false;

    async function run() {
      setMessage("");
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        if (!cancelled) {
          setPhase("need_login");
          setMessage("Faça login com o mesmo e-mail do convite para aceitar.");
        }
        return;
      }

      if (!cancelled) {
        setPhase("busy");
      }

      const { data, error } = await supabase.functions.invoke("accept-invite", {
        body: { token },
      });

      if (cancelled) {
        return;
      }

      if (error) {
        setPhase("error");
        setMessage(error.message || "Não foi possível aceitar o convite.");
        return;
      }

      const payload = data as {
        error?: string;
        detail?: string;
        workspace_id?: string;
        already_member?: boolean;
      };

      if (payload?.error) {
        setPhase("error");
        setMessage(mapAcceptError(payload.error, payload.detail));
        return;
      }

      if (payload?.workspace_id) {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, payload.workspace_id);
      }

      setPhase("done");
      setMessage(
        payload?.already_member
          ? "Você já faz parte deste workspace. Redirecionando..."
          : "Convite aceito. Redirecionando..."
      );
      router.replace("/dashboard");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (token === null) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-sm text-(--text-muted)">Carregando...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-semibold text-text">Convite de workspace</h1>
      <p className="mt-2 text-sm text-(--text-muted)">
        Aceite o convite para entrar na equipe. Use a conta com o mesmo e-mail
        indicado no convite.
      </p>

      {phase === "idle" && token ? (
        <p className="mt-6 text-sm text-(--text-muted)">Preparando...</p>
      ) : null}

      {phase === "need_login" && token ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-(--text-muted)">{message}</p>
          <Link href={buildLoginHref(token)} className={linkButtonClass}>
            Entrar para aceitar
          </Link>
        </div>
      ) : null}

      {phase === "busy" ? (
        <p className="mt-6 text-sm text-(--text-muted)">Processando convite...</p>
      ) : null}

      {phase === "error" ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm font-medium text-red-500">{message}</p>
          {token ? (
            <Link href={buildLoginHref(token)} className={linkButtonClass}>
              Tentar com outra conta
            </Link>
          ) : null}
        </div>
      ) : null}

      {phase === "done" ? (
        <p className="mt-6 text-sm font-medium text-emerald-600">{message}</p>
      ) : null}

      <p className="mt-10 text-center text-sm">
        <Link href="/" className="text-(--primary) hover:underline">
          Ir para a página inicial
        </Link>
      </p>
    </div>
    </AppShell>
  );
}

function mapAcceptError(code: string, detail?: string): string {
  switch (code) {
    case "invite_not_found":
      return "Convite não encontrado ou token inválido.";
    case "invite_already_used":
      return "Este convite já foi utilizado.";
    case "invite_expired":
      return "Este convite expirou. Peça um novo ao administrador.";
    case "invite_email_mismatch":
      return "Este convite foi enviado para outro e-mail. Use a conta correta.";
    case "unauthorized":
      return "Sessão inválida. Entre novamente.";
    default:
      return detail || "Não foi possível aceitar o convite.";
  }
}
