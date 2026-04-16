# 19 - Seed automático de etapas padrão por workspace

## Ação realizada

Foi criada uma nova migration no Supabase para cadastrar automaticamente as etapas padrão do funil sempre que um novo `workspace` for criado.

As etapas adicionadas são:

- `Base`
- `Lead Mapeado`
- `Tentando Contato`
- `Conexão Iniciada`
- `Desqualificado`
- `Qualificado`
- `Reunião Agendada`

Cada etapa é criada com `position` sequencial e `is_system = true`, permitindo ordenação consistente no funil.

A migration também faz backfill para workspaces já existentes, evitando que apenas workspaces novos recebam as etapas padrão.

Para isso foram criadas:

- a função `public.seed_default_funnel_stages_for_workspace(target_workspace_id uuid)`
- a função trigger `public.handle_workspace_created_seed_funnel_stages()`
- o trigger `trg_seed_default_funnel_stages_on_workspace` em `public.workspaces`
