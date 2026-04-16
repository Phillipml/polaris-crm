import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

/**
 * Cliente Supabase para o browser (variáveis NEXT_PUBLIC_*).
 * Use apenas em componentes com `"use client"` ou em efeitos/handlers no cliente.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseBrowserClient() só pode ser chamado no browser. Importe este módulo apenas em código cliente."
    );
  }

  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (veja web/.env.example)."
    );
  }

  browserClient = createClient(url, anonKey);
  return browserClient;
}
