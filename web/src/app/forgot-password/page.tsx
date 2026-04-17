"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import {
  getPasswordPolicyError,
  PASSWORD_POLICY_HINT_PT,
} from "@/lib/auth/password-policy";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { SupabaseClient } from "@supabase/supabase-js";

function isLocalSupabaseApi(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.includes("127.0.0.1") || url.includes("localhost");
}

function recoveryFromHash(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return params.get("type") === "recovery";
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const hasRecoveryRef = useRef(false);
  const isLocalApi = useMemo(() => isLocalSupabaseApi(), []);
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    if (!recoveryFromHash()) {
      return;
    }
    let cancelled = false;
    let supabase: SupabaseClient<Database>;
    try {
      supabase = getSupabaseBrowserClient();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      return;
    }

    function finishFromLink(userEmail: string) {
      if (cancelled || hasRecoveryRef.current) {
        return;
      }
      hasRecoveryRef.current = true;
      setEmail(userEmail);
      setStep("password");
      setInfoMessage("");
      setErrorMessage("");
    }

    function trySession() {
      if (cancelled || hasRecoveryRef.current) {
        return;
      }
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled || hasRecoveryRef.current) {
          return;
        }
        if (recoveryFromHash() && session?.user?.email) {
          finishFromLink(session.user.email);
        }
      });
    }

    trySession();
    const t1 = window.setTimeout(trySession, 400);
    const t2 = window.setTimeout(trySession, 1200);

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || hasRecoveryRef.current) {
        return;
      }
      if (event === "PASSWORD_RECOVERY" && session?.user?.email) {
        finishFromLink(session.user.email);
        return;
      }
      if (
        event === "INITIAL_SESSION" &&
        session?.user?.email &&
        recoveryFromHash()
      ) {
        finishFromLink(session.user.email);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    setIsSending(true);
    try {
      const redirectTo = `${window.location.origin}/forgot-password`;
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      const base =
        "Se o e-mail estiver cadastrado, enviamos um código de 6 dígitos. Volte a esta página e informe o código abaixo.";
      const localHint = isLocalApi
        ? " No ambiente local, abra o Inbucket em http://127.0.0.1:54324 para ver o código."
        : " Verifique também a pasta de spam.";
      setInfoMessage(base + localHint);
      setStep("code");
      setOtpCode("");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    const trimmedEmail = email.trim();
    const trimmedCode = otpCode.trim().replace(/\s/g, "");

    if (!trimmedEmail || !trimmedCode) {
      setErrorMessage("Informe o e-mail e o código de 6 dígitos.");
      return;
    }

    if (!/^\d{6}$/.test(trimmedCode)) {
      setErrorMessage("O código deve ter exatamente 6 números.");
      return;
    }

    setIsVerifying(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedCode,
        type: "recovery",
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      hasRecoveryRef.current = true;
      if (data.user?.email) {
        setEmail(data.user.email);
      }
      setStep("password");
      setInfoMessage("");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleSavePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const policyError = getPasswordPolicyError(password);
    if (policyError) {
      setErrorMessage(policyError);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      await supabase.auth.signOut();
      router.replace("/login?reset=1");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  const cardTitle =
    step === "email"
      ? "Recuperar senha"
      : step === "code"
        ? "Informe o código"
        : "Nova senha";

  const cardDescription =
    step === "email"
      ? "Informe seu e-mail. Você receberá um código para colar aqui e definir uma nova senha."
      : step === "code"
        ? `Digite o código de 6 dígitos enviado para ${email.trim() || "seu e-mail"}.`
        : `Defina uma nova senha para ${email.trim() || "sua conta"}.`;

  return (
    <AuthCard
      title={cardTitle}
      description={cardDescription}
      logoHref={step === "email" ? "/" : null}
      footer={
        <div className="flex flex-col gap-2 text-sm">
          <Link
            className="font-semibold text-(--primary) hover:underline"
            href="/login"
          >
            Voltar para login
          </Link>
          {step !== "email" ? (
            <button
              type="button"
              className="text-left font-semibold text-(--primary) hover:underline"
              onClick={() => {
                void (async () => {
                  const supabase = getSupabaseBrowserClient();
                  await supabase.auth.signOut();
                  hasRecoveryRef.current = false;
                  setStep("email");
                  setOtpCode("");
                  setPassword("");
                  setConfirmPassword("");
                  setErrorMessage("");
                  setInfoMessage("");
                  router.replace("/forgot-password");
                })();
              }}
            >
              Pedir novo código (outro e-mail)
            </button>
          ) : null}
        </div>
      }
    >
      {isLocalApi && step === "email" ? (
        <p className="mb-4 rounded-lg border border-(--border) bg-(--surface-hover)/60 px-3 py-2 text-xs leading-relaxed text-(--text-muted)">
          Ambiente local: os e-mails de autenticação aparecem no Inbucket (
          <a
            href="http://127.0.0.1:54324"
            className="font-semibold text-(--primary) hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            http://127.0.0.1:54324
          </a>
          ), não na sua caixa real.
        </p>
      ) : null}

      {step === "email" ? (
        <form className="space-y-4" onSubmit={handleSendCode} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
            />
          </div>
          <div aria-live="polite" className="min-h-5">
            {errorMessage ? (
              <p role="alert" className="text-sm font-medium text-red-500">
                {errorMessage}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={isSending}>
            {isSending ? "Enviando..." : "Enviar código por e-mail"}
          </Button>
        </form>
      ) : null}

      {step === "code" ? (
        <form className="space-y-4" onSubmit={handleVerifyCode} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="codeEmail" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="codeEmail"
              name="codeEmail"
              type="email"
              autoComplete="email"
              readOnly
              value={email}
              className="w-full rounded-lg border border-(--border) bg-(--surface-hover)/40 px-3 py-2.5 text-sm text-(--text-muted)"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="otpCode" className="text-sm font-medium">
              Código de 6 dígitos
            </label>
            <input
              id="otpCode"
              name="otpCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={otpCode}
              onChange={(event) =>
                setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm tracking-widest outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
            />
          </div>
          {isLocalApi ? (
            <p className="text-xs text-(--text-muted)">
              Dica: no ambiente local o código está no Inbucket
              (http://127.0.0.1:54324).
            </p>
          ) : null}
          <div aria-live="polite" className="min-h-5">
            {errorMessage ? (
              <p role="alert" className="text-sm font-medium text-red-500">
                {errorMessage}
              </p>
            ) : null}
            {infoMessage ? (
              <p className="text-sm font-medium text-emerald-600">
                {infoMessage}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? "Validando..." : "Continuar para nova senha"}
          </Button>
        </form>
      ) : null}

      {step === "password" ? (
        <form className="space-y-4" onSubmit={handleSavePassword} noValidate>
          <p className="rounded-lg border border-(--border) bg-(--surface-hover)/60 px-3 py-2 text-sm text-text">
            <span className="text-(--text-muted)">Conta:</span>{" "}
            <span className="font-medium">{email.trim()}</span>
          </p>
          <p className="text-xs leading-relaxed text-(--text-muted)">
            {PASSWORD_POLICY_HINT_PT}
          </p>
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-sm font-medium">
              Nova senha
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirmNewPassword" className="text-sm font-medium">
              Confirmar nova senha
            </label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-(--border) bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/25"
            />
          </div>
          <div aria-live="polite" className="min-h-5">
            {errorMessage ? (
              <p role="alert" className="text-sm font-medium text-red-500">
                {errorMessage}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar senha e ir para o login"}
          </Button>
        </form>
      ) : null}
    </AuthCard>
  );
}
