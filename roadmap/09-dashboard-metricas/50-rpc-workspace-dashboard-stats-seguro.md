# 50 — RPC `workspace_dashboard_stats` com validação de membership

## Entrega

- Migration `supabase/migrations/20260417183000_workspace_dashboard_stats_rpc.sql` com função:
  - `public.workspace_dashboard_stats(p_workspace uuid)`
  - retorno: `total_leads`, `stage_counts` (`jsonb` por `stage_id`), `suggestions_last_7d`
- Estratégia de segurança:
  - `SECURITY DEFINER`
  - `search_path` restrito (`public, pg_temp`)
  - validação explícita de membership por `auth.uid()` em `workspace_members`
  - erro para não autenticado (`not_authenticated`) e sem vínculo (`forbidden_workspace`)
- Permissões:
  - `revoke all ... from public`
  - `grant execute ... to authenticated`

## Documentação

- `supabase/README.md`: seção da RPC com uso e decisão de segurança.
- `README.md`: atualização em Desafios e checklist de funcionalidades.
