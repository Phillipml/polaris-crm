alter table public.lead_message_suggestions
  add column if not exists source text not null default 'manual';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lead_message_suggestions_source_check'
  ) then
    alter table public.lead_message_suggestions
      add constraint lead_message_suggestions_source_check
      check (source in ('manual', 'auto_trigger'));
  end if;
end $$;

drop policy if exists lead_message_suggestions_select on public.lead_message_suggestions;
create policy lead_message_suggestions_select
on public.lead_message_suggestions
for select
to authenticated
using (
  exists (
    select 1
    from public.leads l
    where l.id = lead_message_suggestions.lead_id
      and l.workspace_id = lead_message_suggestions.workspace_id
      and public.is_workspace_member(l.workspace_id)
  )
);

drop policy if exists lead_message_suggestions_insert on public.lead_message_suggestions;
create policy lead_message_suggestions_insert
on public.lead_message_suggestions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.leads l
    where l.id = lead_message_suggestions.lead_id
      and l.workspace_id = lead_message_suggestions.workspace_id
      and public.is_workspace_member(l.workspace_id)
  )
);

drop policy if exists lead_message_suggestions_update on public.lead_message_suggestions;
create policy lead_message_suggestions_update
on public.lead_message_suggestions
for update
to authenticated
using (
  exists (
    select 1
    from public.leads l
    where l.id = lead_message_suggestions.lead_id
      and l.workspace_id = lead_message_suggestions.workspace_id
      and public.is_workspace_member(l.workspace_id)
  )
)
with check (
  exists (
    select 1
    from public.leads l
    where l.id = lead_message_suggestions.lead_id
      and l.workspace_id = lead_message_suggestions.workspace_id
      and public.is_workspace_member(l.workspace_id)
  )
);

drop policy if exists lead_message_suggestions_delete on public.lead_message_suggestions;
create policy lead_message_suggestions_delete
on public.lead_message_suggestions
for delete
to authenticated
using (
  exists (
    select 1
    from public.leads l
    where l.id = lead_message_suggestions.lead_id
      and l.workspace_id = lead_message_suggestions.workspace_id
      and public.is_workspace_member(l.workspace_id)
  )
);
