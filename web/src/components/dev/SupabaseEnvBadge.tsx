/**
 * Indicador de ambiente (build-time) — não chama a API Supabase.
 */
export function SupabaseEnvBadge() {
  const ok = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        ok
          ? "border-[var(--border)] bg-[var(--surface)] text-[var(--primary)]"
          : "border-amber-500/35 bg-amber-500/10 text-[var(--text)]"
      }`}
    >
      {ok ? "Variáveis Supabase detectadas" : "Configure .env.local (Supabase)"}
    </span>
  );
}
