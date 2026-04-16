import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  logoHref?: string | null;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
  logoHref = "/",
}: AuthCardProps) {
  return (
    <div className="min-h-screen bg-bg-base px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          {logoHref ? (
            <Link href={logoHref} aria-label="Voltar para home">
              <Image
                src="/logoFull.svg"
                alt="PolarisCRM"
                width={158}
                height={32}
                priority
              />
            </Link>
          ) : (
            <Image
              src="/logoFull.svg"
              alt="PolarisCRM"
              width={158}
              height={32}
              priority
            />
          )}
          <ThemeToggle />
        </div>

        <section
          className="rounded-2xl border border-(--border) bg-surface p-6 shadow-sm sm:p-8"
          aria-labelledby="auth-title"
        >
          <header className="space-y-2">
            <h1
              id="auth-title"
              className="text-2xl font-semibold tracking-tight"
            >
              {title}
            </h1>
            <p className="text-sm text-(--text-muted)">{description}</p>
          </header>
          <div className="mt-6">{children}</div>
          {footer ? (
            <div className="mt-6 text-sm text-(--text-muted)">{footer}</div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
