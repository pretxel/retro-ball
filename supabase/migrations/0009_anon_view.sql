-- Function that returns cards with author_id redacted under anon mode.
create or replace function public.cards_visible(p_viewer_id uuid)
returns table(
  id uuid,
  room_id uuid,
  column_key text,
  author_id uuid,
  body text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    c.id,
    c.room_id,
    c.column_key,
    case
      when r.anonymous_mode and not r.authors_revealed and c.author_id <> p_viewer_id then null
      else c.author_id
    end as author_id,
    c.body,
    c.created_at,
    c.updated_at
  from public.cards c
  join public.rooms r on r.id = c.room_id
  where c.room_id = (select room_id from public.participants where id = p_viewer_id);
$$;

grant execute on function public.cards_visible(uuid) to anon, authenticated;

-- Drop the old 1-arg get_room_state so the new 2-arg version (with default null)
-- is unambiguous when called with a single argument.
drop function if exists public.get_room_state(uuid);

-- Update get_room_state to use cards_visible (2-arg version)
create or replace function public.get_room_state(p_room_id uuid, p_viewer_id uuid default null)
returns table(
  room jsonb,
  participants jsonb,
  cards jsonb,
  votes jsonb
)
language sql security definer set search_path = public as $$
  select
    (select to_jsonb(r) from public.rooms r where r.id = p_room_id),
    (select coalesce(jsonb_agg(p), '[]'::jsonb) from public.participants p where p.room_id = p_room_id),
    (select coalesce(jsonb_agg(cv), '[]'::jsonb) from public.cards_visible(p_viewer_id) cv where cv.room_id = p_room_id),
    (select coalesce(jsonb_agg(v), '[]'::jsonb) from public.votes v where v.room_id = p_room_id);
$$;

grant execute on function public.get_room_state(uuid, uuid) to anon, authenticated;
