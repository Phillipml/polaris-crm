"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import {
  getPasswordPolicyError,
  PASSWORD_POLICY_HINT_PT,
} from "@/lib/auth/password-policy";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function AccountPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setReady(true);
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const policyError = getPasswordPolicyError(password);
    if (policyError) {
      setErrorMessage(policyError);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(getAuthErrorMessage(error.message));
      return;
    }

    setSuccessMessage("Senha atualizada com sucesso.");
    setPassword("");
    setConfirmPassword("");
  }

  if (!ready) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm text-(--text-muted)">Carregando...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
        <Card
          title="Senha da conta"
          description="Defina ou altere a senha usada com e-mail e senha. Se você entrou só por outro método, pode criar uma senha aqui."
        >
          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <p className="text-xs leading-relaxed text-(--text-muted)">
              {PASSWORD_POLICY_HINT_PT}
            </p>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Nova senha
              </label>
              <input
                id="password"
                name="password"
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
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar nova senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
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
              {!errorMessage && successMessage ? (
                <p className="text-sm font-medium text-emerald-600">
                  {successMessage}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar senha"}
              </Button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
              >
                Voltar ao dashboard
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
