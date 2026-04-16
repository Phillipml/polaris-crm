create or replace function public.transition_lead_stage_atomic(
  p_workspace_id uuid,
  p_lead_id uuid,
  p_destination_stage_id uuid
)
returns public.leads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.leads%rowtype;
  v_destination_stage public.funnel_stages%rowtype;
  v_snapshot jsonb;
  v_missing_fields text[];
  v_error_payload text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated'
      using errcode = 'P0001';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'forbidden_workspace'
      using errcode = 'P0001';
  end if;

  select *
  into v_lead
  from public.leads l
  where l.id = p_lead_id
    and l.workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception 'lead_not_found'
      using errcode = 'P0001';
  end if;

  select *
  into v_destination_stage
  from public.funnel_stages fs
  where fs.id = p_destination_stage_id
    and fs.workspace_id = p_workspace_id;

  if not found then
    raise exception 'destination_stage_not_found'
      using errcode = 'P0001';
  end if;

  v_snapshot = jsonb_build_object(
    'id', v_lead.id,
    'workspace_id', v_lead.workspace_id,
    'stage_id', v_lead.stage_id,
    'owner_user_id', v_lead.owner_user_id,
    'full_name', v_lead.full_name,
    'company_name', v_lead.company_name,
    'email', v_lead.email,
    'phone', v_lead.phone,
    'job_title', v_lead.job_title,
    'linkedin_url', v_lead.linkedin_url,
    'source', v_lead.source,
    'status', v_lead.status,
    'notes', v_lead.notes,
    'custom_fields', v_lead.custom_fields
  );

  select coalesce(array_agg(srf.field_kind::text || ':' || srf.field_key order by srf.field_kind, srf.field_key), array[]::text[])
  into v_missing_fields
  from public.stage_required_fields srf
  where srf.stage_id = v_destination_stage.id
    and (
      case
        when srf.field_kind = 'standard' then
          case srf.field_key
            when 'full_name' then nullif(trim(coalesce(v_lead.full_name, '')), '') is null
            when 'company_name' then nullif(trim(coalesce(v_lead.company_name, '')), '') is null
            when 'email' then nullif(trim(coalesce(v_lead.email, '')), '') is null
            when 'phone' then nullif(trim(coalesce(v_lead.phone, '')), '') is null
            when 'job_title' then nullif(trim(coalesce(v_lead.job_title, '')), '') is null
            when 'linkedin_url' then nullif(trim(coalesce(v_lead.linkedin_url, '')), '') is null
            when 'source' then nullif(trim(coalesce(v_lead.source, '')), '') is null
            when 'status' then nullif(trim(coalesce(v_lead.status, '')), '') is null
            when 'notes' then nullif(trim(coalesce(v_lead.notes, '')), '') is null
            when 'owner_user_id' then v_lead.owner_user_id is null
            else true
          end
        when srf.field_kind = 'custom' then
          case
            when not (coalesce(v_lead.custom_fields, '{}'::jsonb) ? srf.field_key) then true
            when jsonb_typeof(coalesce(v_lead.custom_fields, '{}'::jsonb) -> srf.field_key) = 'null' then true
            when jsonb_typeof(coalesce(v_lead.custom_fields, '{}'::jsonb) -> srf.field_key) = 'string'
              and nullif(trim(coalesce(v_lead.custom_fields ->> srf.field_key, '')), '') is null then true
            else false
          end
        else true
      end
    );

  if coalesce(array_length(v_missing_fields, 1), 0) > 0 then
    v_error_payload = jsonb_build_object(
      'code', 'required_fields_missing',
      'destination_stage_id', v_destination_stage.id,
      'missing_fields', to_jsonb(v_missing_fields),
      'lead_snapshot', v_snapshot
    )::text;
    raise exception '%', v_error_payload using errcode = 'P0001';
  end if;

  update public.leads
  set stage_id = v_destination_stage.id,
      updated_at = now()
  where id = v_lead.id
    and workspace_id = p_workspace_id
  returning *
  into v_lead;

  return v_lead;
end;
$$;

revoke all on function public.transition_lead_stage_atomic(uuid, uuid, uuid) from public;
grant execute on function public.transition_lead_stage_atomic(uuid, uuid, uuid) to authenticated;
