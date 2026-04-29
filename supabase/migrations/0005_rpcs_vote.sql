create or replace function public.cast_vote(
  p_participant_id uuid,
  p_card_id uuid
) returns public.votes
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_limit int;
  v_count int;
  v_vote public.votes;
begin
  select c.room_id into v_room_id from public.cards c where c.id = p_card_id;
  if v_room_id is null then
    raise exception 'card_not_found' using errcode = 'P0001';
  end if;
  if not public._participant_in_room(p_participant_id, v_room_id) then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._room_active(v_room_id) then
    raise exception 'room_ended' using errcode = 'P0001';
  end if;
  select votes_per_user into v_limit from public.rooms where id = v_room_id;
  select count(*) into v_count from public.votes where voter_id = p_participant_id and room_id = v_room_id;
  if v_count >= v_limit then
    raise exception 'vote_limit_reached' using errcode = 'P0001';
  end if;
  insert into public.votes (room_id, card_id, voter_id)
    values (v_room_id, p_card_id, p_participant_id)
    returning * into v_vote;
  perform public._bump_activity(v_room_id);
  return v_vote;
end;
$$;

create or replace function public.revoke_vote(
  p_participant_id uuid,
  p_card_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_room_id uuid;
begin
  select id, room_id into v_id, v_room_id
    from public.votes
    where voter_id = p_participant_id and card_id = p_card_id
    order by created_at desc
    limit 1;
  if v_id is null then
    return;  -- no-op
  end if;
  delete from public.votes where id = v_id;
  perform public._bump_activity(v_room_id);
end;
$$;

grant execute on function public.cast_vote(uuid, uuid)    to anon, authenticated;
grant execute on function public.revoke_vote(uuid, uuid)  to anon, authenticated;
