create or replace function public.rb_delete_card(
  p_participant_id uuid,
  p_card_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_card public.rb_cards;
begin
  select * into v_card from public.rb_cards where id = p_card_id;
  if v_card.id is null then
    raise exception 'card_not_found' using errcode = 'P0001';
  end if;
  if v_card.author_id <> p_participant_id and not public._rb_is_facilitator(p_participant_id) then
    raise exception 'not_authorized' using errcode = 'P0001';
  end if;
  if not public._rb_room_active(v_card.room_id) then
    raise exception 'room_ended' using errcode = 'P0001';
  end if;
  delete from public.rb_cards where id = p_card_id;
  perform public._rb_bump_activity(v_card.room_id);
end;
$$;

create or replace function public.rb_revoke_vote(
  p_participant_id uuid,
  p_card_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_room_id uuid;
begin
  select id, room_id into v_id, v_room_id
    from public.rb_votes
    where voter_id = p_participant_id and card_id = p_card_id
    order by created_at desc
    limit 1;
  if v_id is null then
    return;
  end if;
  if not public._rb_room_active(v_room_id) then
    raise exception 'room_ended' using errcode = 'P0001';
  end if;
  delete from public.rb_votes where id = v_id;
  perform public._rb_bump_activity(v_room_id);
end;
$$;
