"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { getAuthErrorMessage } from "@/lib/auth/messages";
import {
  getPasswordPolicyError,
  PASSWORD_POLICY_HINT_PT,
} from "@/lib/auth/password-policy";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    const policyError = getPasswordPolicyError(password);
    if (policyError) {
      setErrorMessage(policyError);
      return;
    }

    setIsSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/login`;
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      if (data.session) {
        router.push("/onboarding/workspace");
        return;
      }

      router.push("/email-confirmation-pending");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Criar conta"
      description="Comece seu workspace no PolarisCRM."
      footer={
        <p>
          Já tem conta?{" "}
          <Link
            className="font-semibold text-(--primary) hover:underline"
            href="/login"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <p className="text-xs leading-relaxed text-(--text-muted)">
            {PASSWORD_POLICY_HINT_PT}
          </p>
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

        <div aria-live="polite" className="min-h-5">
          {errorMessage ? (
            <p role="alert" className="text-sm font-medium text-red-500">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </AuthCard>
  );
}
