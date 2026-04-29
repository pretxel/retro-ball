create or replace function public.set_anonymous_mode(
  p_participant_id uuid,
  p_on boolean
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
  update public.rooms
    set anonymous_mode = p_on,
        authors_revealed = case when p_on then false else authors_revealed end
    where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

create or replace function public.reveal_authors(p_participant_id uuid)
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
  update public.rooms set authors_revealed = true where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

create or replace function public.set_votes_per_user(
  p_participant_id uuid,
  p_n int
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
  if p_n < 1 or p_n > 20 then
    raise exception 'invalid_votes_per_user' using errcode = 'P0001';
  end if;
  update public.rooms set votes_per_user = p_n where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

create or replace function public.end_room(p_participant_id uuid)
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
  update public.rooms set ended_at = now() where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

grant execute on function public.set_anonymous_mode(uuid, boolean) to anon, authenticated;
grant execute on function public.reveal_authors(uuid)              to anon, authenticated;
grant execute on function public.set_votes_per_user(uuid, int)     to anon, authenticated;
grant execute on function public.end_room(uuid)                    to anon, authenticated;
