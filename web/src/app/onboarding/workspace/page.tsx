import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function WorkspaceOnboardingPage() {
  return (
    <div className="min-h-screen bg-bg-base px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-center">
          <Image src="/logoFull.svg" alt="PolarisCRM" width={172} height={36} priority />
        </div>

        <section className="rounded-2xl border border-(--border) bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bem-vindo ao onboarding de workspace
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-(--text-muted)">
            Seu login foi concluído. O próximo passo é criar seu primeiro workspace
            para começar a organizar leads, etapas e atividades do time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button>Continuar</Button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-(--border) px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-(--surface-hover)"
            >
              Voltar para home
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
