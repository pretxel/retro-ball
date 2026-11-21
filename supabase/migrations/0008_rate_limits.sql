-- Sliding-window rate limit using existing tables (no new state).
create or replace function public._rb_rate_limit_check(
  p_participant_id uuid,
  p_action text,
  p_limit int,
  p_window interval default interval '1 minute'
) returns void
language plpgsql as $$
declare v_count int;
begin
  if p_action = 'add_card' then
    select count(*) into v_count from public.rb_cards
      where author_id = p_participant_id and created_at > now() - p_window;
  elsif p_action = 'cast_vote' then
    select count(*) into v_count from public.rb_votes
      where voter_id = p_participant_id and created_at > now() - p_window;
  elsif p_action = 'edit_card' then
    select count(*) into v_count from public.rb_cards
      where author_id = p_participant_id and updated_at > now() - p_window;
  else
    return;
  end if;
  if v_count >= p_limit then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
end;
$$;

-- Patch RPCs to call rate-limit
create or replace function public.rb_add_card(
  p_participant_id uuid,
  p_column_key text,
  p_body text
) returns public.rb_cards
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_card public.rb_cards;
begin
  perform public._rb_rate_limit_check(p_participant_id, 'add_card', 30);
  select room_id into v_room_id from public.rb_participants where id = p_participant_id;
  if v_room_id is null then raise exception 'not_in_room' using errcode = 'P0001'; end if;
  if not public._rb_room_active(v_room_id) then raise exception 'room_ended' using errcode = 'P0001'; end if;
  insert into public.rb_cards (room_id, column_key, author_id, body)
    values (v_room_id, p_column_key, p_participant_id, p_body)
    returning * into v_card;
  perform public._rb_bump_activity(v_room_id);
  return v_card;
end;
$$;

create or replace function public.rb_cast_vote(
  p_participant_id uuid,
  p_card_id uuid
) returns public.rb_votes
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_limit int;
  v_count int;
  v_vote public.rb_votes;
begin
  perform public._rb_rate_limit_check(p_participant_id, 'cast_vote', 60);
  select c.room_id into v_room_id from public.rb_cards c where c.id = p_card_id;
  if v_room_id is null then raise exception 'card_not_found' using errcode = 'P0001'; end if;
  if not public._rb_participant_in_room(p_participant_id, v_room_id) then raise exception 'not_in_room' using errcode = 'P0001'; end if;
  if not public._rb_room_active(v_room_id) then raise exception 'room_ended' using errcode = 'P0001'; end if;
  select votes_per_user into v_limit from public.rb_rooms where id = v_room_id;
  select count(*) into v_count from public.rb_votes where voter_id = p_participant_id and room_id = v_room_id;
  if v_count >= v_limit then raise exception 'vote_limit_reached' using errcode = 'P0001'; end if;
  insert into public.rb_votes (room_id, card_id, voter_id)
    values (v_room_id, p_card_id, p_participant_id)
    returning * into v_vote;
  perform public._rb_bump_activity(v_room_id);
  return v_vote;
end;
$$;
