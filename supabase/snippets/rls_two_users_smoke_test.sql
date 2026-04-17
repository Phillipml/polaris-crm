-- Smoke test de RLS com dois usuarios (A e B).
-- Pre-requisito: ambos autenticados e membros de workspaces diferentes.
-- Execute no SQL Editor, trocando os UUIDs abaixo.

-- 1) Parametros
-- user_a: usuario membro do workspace_a
-- user_b: usuario membro do workspace_b
-- workspace_a != workspace_b
-- lead_a: lead do workspace_a
-- lead_b: lead do workspace_b

-- 2) Contexto do usuario A
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-00000000000a'; -- user_a

-- Deve retornar dados do workspace A
select count(*) as a_leads_ok
from public.leads
where workspace_id = '10000000-0000-0000-0000-00000000000a';

-- Deve retornar 0 (isolamento cross-workspace)
select count(*) as a_cannot_see_b
from public.leads
where workspace_id = '20000000-0000-0000-0000-00000000000b';

-- Deve falhar/afetar 0 linhas ao tentar escrever no workspace B
update public.leads
set notes = 'forbidden-by-rls'
where workspace_id = '20000000-0000-0000-0000-00000000000b';

-- 3) Contexto do usuario B
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-00000000000b'; -- user_b

-- Espelhamento: ve B, nao ve A
select count(*) as b_leads_ok
from public.leads
where workspace_id = '20000000-0000-0000-0000-00000000000b';

select count(*) as b_cannot_see_a
from public.leads
where workspace_id = '10000000-0000-0000-0000-00000000000a';

-- 4) Tabelas de auditoria/eventos (tambem devem isolar por workspace)
select count(*) as b_activities_ok
from public.lead_activities
where workspace_id = '20000000-0000-0000-0000-00000000000b';

select count(*) as b_activities_cannot_see_a
from public.lead_activities
where workspace_id = '10000000-0000-0000-0000-00000000000a';
