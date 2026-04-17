"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export function UserMenu() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setEmail(data.session?.user.email ?? null);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = getSupabaseBrowserClient();
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.replace("/login");
    }
  }

  if (email === undefined) {
    return (
      <span
        className="h-9 w-20 animate-pulse rounded-lg bg-(--surface-hover)"
        aria-hidden
      />
    );
  }

  if (email === null) {
    return null;
  }

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-(--border) bg-surface px-3 py-2 text-sm font-medium text-text outline-none transition hover:bg-(--surface-hover) focus-visible:ring-2 focus-visible:ring-(--ring)/25 [&::-webkit-details-marker]:hidden">
        <span className="max-w-[140px] truncate">{email}</span>
        <span className="text-(--text-muted)" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 min-w-[200px] rounded-xl border border-(--border) bg-surface py-1 shadow-lg">
        <Link
          href="/settings/workspace-members"
          className="block px-4 py-2.5 text-sm text-text hover:bg-(--surface-hover)"
        >
          Membros do workspace
        </Link>
        <Link
          href="/account/password"
          className="block px-4 py-2.5 text-sm text-text hover:bg-(--surface-hover)"
        >
          Trocar senha
        </Link>
        <button
          type="button"
          className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-(--surface-hover) disabled:opacity-50"
          disabled={isSigningOut}
          onClick={() => void handleSignOut()}
        >
          {isSigningOut ? "Saindo..." : "Sair"}
        </button>
      </div>
    </details>
  );
}
