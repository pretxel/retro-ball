create or replace function public._room_for_participant(p_pid uuid)
returns uuid language sql stable as $$
  select room_id from public.participants where id = p_pid;
$$;

create or replace function public.start_timer(
  p_participant_id uuid,
  p_seconds int
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid := public._room_for_participant(p_participant_id);
begin
  if v_room_id is null then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._is_facilitator(p_participant_id) then
    raise exception 'not_facilitator' using errcode = 'P0001';
  end if;
  if p_seconds < 30 or p_seconds > 3600 then
    raise exception 'invalid_seconds' using errcode = 'P0001';
  end if;
  update public.rooms
    set timer_started_at = now(), timer_seconds = p_seconds
    where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

create or replace function public.stop_timer(p_participant_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid := public._room_for_participant(p_participant_id);
begin
  if v_room_id is null then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._is_facilitator(p_participant_id) then
    raise exception 'not_facilitator' using errcode = 'P0001';
  end if;
  update public.rooms
    set timer_started_at = null, timer_seconds = null
    where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

grant execute on function public.start_timer(uuid, int) to anon, authenticated;
grant execute on function public.stop_timer(uuid)       to anon, authenticated;
