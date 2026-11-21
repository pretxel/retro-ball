-- Internal: bump activity
create or replace function public._rb_bump_activity(p_room_id uuid)
returns void language sql as $$
  update public.rb_rooms set last_activity_at = clock_timestamp() where id = p_room_id;
$$;

-- Internal: generate unique 6-digit code, retry on collision
create or replace function public._rb_generate_room_code()
returns text language plpgsql as $$
declare
  candidate text;
  attempts int := 0;
begin
  loop
    candidate := lpad((floor(random() * 1000000))::int::text, 6, '0');
    if not exists (select 1 from public.rb_rooms where code = candidate) then
      return candidate;
    end if;
    attempts := attempts + 1;
    if attempts > 10 then
      raise exception 'room_code_exhausted' using errcode = 'P0001';
    end if;
  end loop;
end;
$$;

create or replace function public.rb_create_room(p_display_name text)
returns table(room_id uuid, code text, participant_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_code text;
  v_participant_id uuid;
begin
  v_code := public._rb_generate_room_code();
  insert into public.rb_rooms (code) values (v_code) returning id into v_room_id;
  insert into public.rb_participants (room_id, display_name, is_facilitator)
    values (v_room_id, p_display_name, true)
    returning id into v_participant_id;
  update public.rb_rooms set facilitator_id = v_participant_id where id = v_room_id;
  return query select v_room_id, v_code, v_participant_id;
end;
$$;

create or replace function public.rb_join_room(p_code text, p_display_name text)
returns table(room_id uuid, participant_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_participant_id uuid;
begin
  select id into v_room_id from public.rb_rooms where code = p_code and ended_at is null;
  if v_room_id is null then
    raise exception 'room_not_found' using errcode = 'P0001';
  end if;
  insert into public.rb_participants (room_id, display_name)
    values (v_room_id, p_display_name)
    returning id into v_participant_id;
  perform public._rb_bump_activity(v_room_id);
  return query select v_room_id, v_participant_id;
end;
$$;

create or replace function public.rb_get_room_state(p_room_id uuid)
returns table(
  room jsonb,
  participants jsonb,
  cards jsonb,
  votes jsonb
)
language sql security definer set search_path = public as $$
  select
    (select to_jsonb(r) from public.rb_rooms r where r.id = p_room_id),
    (select coalesce(jsonb_agg(p), '[]'::jsonb) from public.rb_participants p where p.room_id = p_room_id),
    (select coalesce(jsonb_agg(c), '[]'::jsonb) from public.rb_cards c where c.room_id = p_room_id),
    (select coalesce(jsonb_agg(v), '[]'::jsonb) from public.rb_votes v where v.room_id = p_room_id);
$$;

grant execute on function public.rb_create_room(text)        to anon, authenticated;
grant execute on function public.rb_join_room(text, text)    to anon, authenticated;
grant execute on function public.rb_get_room_state(uuid)     to anon, authenticated;
