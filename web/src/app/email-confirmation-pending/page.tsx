import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export default function EmailConfirmationPendingPage() {
  return (
    <AuthCard
      title="Confirme seu e-mail"
      description="Sua conta foi criada. Falta apenas validar o endereço de e-mail para liberar o acesso."
      footer={
        <p>
          Já confirmou?{" "}
          <Link
            className="font-semibold text-(--primary) hover:underline"
            href="/login"
          >
            Ir para login
          </Link>
        </p>
      }
    >
      <div className="space-y-4 text-sm text-(--text-muted)">
        <p>
          Enviamos um link de confirmação para o e-mail informado no cadastro.
          Abra sua caixa de entrada e clique no link para concluir.
        </p>
        <p>
          Em ambiente local com Supabase CLI, verifique os e-mails no Inbucket:
          <a
            href="http://127.0.0.1:54324"
            className="ml-1 font-semibold text-(--primary) hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            http://127.0.0.1:54324
          </a>
        </p>
      </div>
    </AuthCard>
  );
}
