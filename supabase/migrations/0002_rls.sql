alter table public.rb_rooms          enable row level security;
alter table public.rb_participants   enable row level security;
alter table public.rb_cards          enable row level security;
alter table public.rb_votes          enable row level security;

create policy rooms_select        on public.rb_rooms        for select to anon, authenticated using (true);
create policy participants_select on public.rb_participants for select to anon, authenticated using (true);
create policy cards_select        on public.rb_cards        for select to anon, authenticated using (true);
create policy votes_select        on public.rb_votes        for select to anon, authenticated using (true);

-- no insert/update/delete policies → all writes denied to anon/authenticated
-- (security-definer RPCs run as table owner and bypass RLS)
