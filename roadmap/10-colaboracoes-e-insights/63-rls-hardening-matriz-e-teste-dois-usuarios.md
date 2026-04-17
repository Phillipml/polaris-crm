# 63 — Revisão de RLS, matriz de policies e smoke test com dois usuários

## O que foi feito

- Migration `supabase/migrations/20260418233000_rls_hardening_all_public_tables.sql` para hardening idempotente de RLS:
  - garante `enable row level security` em todas as tabelas `public` do projeto;
  - reforça `revoke` de `anon/authenticated` nas tabelas internas (`app_runtime_config` e `lead_stage_webhook_campaign_dedupe`);
  - reaplica grants esperados para tabelas de produto conforme políticas já existentes.
- Criação do script `supabase/snippets/rls_two_users_smoke_test.sql` com cenário de isolamento entre usuário A e usuário B em workspaces distintos.
- Atualização do `README.md` com anexo curto em formato matriz:
  - `tabela x operação x policy`;
  - link para execução do smoke test de dois usuários.

## Como validar

- Aplicar migrações.
- Executar o script de smoke test com dois usuários reais e dois workspaces distintos.
- Confirmar:
  - cada usuário vê apenas dados do próprio workspace;
  - tentativas de escrita cross-workspace são bloqueadas por RLS;
  - tabelas internas continuam sem acesso por `authenticated`.
