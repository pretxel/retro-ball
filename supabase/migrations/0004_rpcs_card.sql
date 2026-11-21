create or replace function public._rb_participant_in_room(p_pid uuid, p_room_id uuid)
returns boolean language sql stable as $$
  select exists(select 1 from public.rb_participants where id = p_pid and room_id = p_room_id);
$$;

create or replace function public._rb_is_facilitator(p_pid uuid)
returns boolean language sql stable as $$
  select coalesce((select is_facilitator from public.rb_participants where id = p_pid), false);
$$;

create or replace function public._rb_room_active(p_room_id uuid)
returns boolean language sql stable as $$
  select exists(select 1 from public.rb_rooms where id = p_room_id and ended_at is null);
$$;

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
  select room_id into v_room_id from public.rb_participants where id = p_participant_id;
  if v_room_id is null then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._rb_room_active(v_room_id) then
    raise exception 'room_ended' using errcode = 'P0001';
  end if;
  insert into public.rb_cards (room_id, column_key, author_id, body)
    values (v_room_id, p_column_key, p_participant_id, p_body)
    returning * into v_card;
  perform public._rb_bump_activity(v_room_id);
  return v_card;
end;
$$;

create or replace function public.rb_edit_card(
  p_participant_id uuid,
  p_card_id uuid,
  p_body text
) returns public.rb_cards
language plpgsql security definer set search_path = public as $$
declare
  v_card public.rb_cards;
begin
  select * into v_card from public.rb_cards where id = p_card_id;
  if v_card.id is null then
    raise exception 'card_not_found' using errcode = 'P0001';
  end if;
  if v_card.author_id <> p_participant_id then
    raise exception 'not_card_owner' using errcode = 'P0001';
  end if;
  if not public._rb_room_active(v_card.room_id) then
    raise exception 'room_ended' using errcode = 'P0001';
  end if;
  update public.rb_cards set body = p_body, updated_at = now() where id = p_card_id returning * into v_card;
  perform public._rb_bump_activity(v_card.room_id);
  return v_card;
end;
$$;

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
  delete from public.rb_cards where id = p_card_id;
  perform public._rb_bump_activity(v_card.room_id);
end;
$$;

grant execute on function public.rb_add_card(uuid, text, text)   to anon, authenticated;
grant execute on function public.rb_edit_card(uuid, uuid, text)  to anon, authenticated;
grant execute on function public.rb_delete_card(uuid, uuid)      to anon, authenticated;
