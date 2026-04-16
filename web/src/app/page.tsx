"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    async function routeBySession() {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        return;
      }

      router.replace("/login");
    }

    routeBySession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <p className="text-sm text-(--text-muted)">Verificando autenticação...</p>
    </div>
  );
}
