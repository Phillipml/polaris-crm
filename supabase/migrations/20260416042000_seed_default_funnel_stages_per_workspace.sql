create or replace function public.seed_default_funnel_stages_for_workspace(target_workspace_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.funnel_stages (workspace_id, name, position, is_system)
  select
    target_workspace_id,
    seed.name,
    seed.position,
    true
  from (
    values
      ('Base', 1),
      ('Lead Mapeado', 2),
      ('Tentando Contato', 3),
      ('Conexão Iniciada', 4),
      ('Desqualificado', 5),
      ('Qualificado', 6),
      ('Reunião Agendada', 7)
  ) as seed(name, position)
  where not exists (
    select 1
    from public.funnel_stages fs
    where fs.workspace_id = target_workspace_id
      and fs.name = seed.name
  );
$$;

create or replace function public.handle_workspace_created_seed_funnel_stages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_funnel_stages_for_workspace(new.id);
  return new;
end;
$$;

drop trigger if exists trg_seed_default_funnel_stages_on_workspace
on public.workspaces;

create trigger trg_seed_default_funnel_stages_on_workspace
after insert on public.workspaces
for each row
execute function public.handle_workspace_created_seed_funnel_stages();

select public.seed_default_funnel_stages_for_workspace(id)
from public.workspaces;

grant execute on function public.seed_default_funnel_stages_for_workspace(uuid) to authenticated;
