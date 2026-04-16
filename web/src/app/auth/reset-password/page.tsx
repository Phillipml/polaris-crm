"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function AuthResetPasswordRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const next = `/forgot-password${window.location.search}${window.location.hash}`;
    router.replace(next);
  }, [router]);

  return (
    <AuthCard
      title="Redirecionando"
      description="A redefinição de senha pelo link agora acontece na mesma página em que você pediu o código."
      footer={
        <Link className="font-semibold text-(--primary) hover:underline" href="/forgot-password">
          Ir para recuperação de senha
        </Link>
      }
    >
      <p className="text-sm text-(--text-muted)">Aguarde um instante.</p>
    </AuthCard>
  );
}
