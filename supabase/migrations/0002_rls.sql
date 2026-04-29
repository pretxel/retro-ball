alter table public.rooms          enable row level security;
alter table public.participants   enable row level security;
alter table public.cards          enable row level security;
alter table public.votes          enable row level security;

create policy rooms_select        on public.rooms        for select to anon, authenticated using (true);
create policy participants_select on public.participants for select to anon, authenticated using (true);
create policy cards_select        on public.cards        for select to anon, authenticated using (true);
create policy votes_select        on public.votes        for select to anon, authenticated using (true);

-- no insert/update/delete policies → all writes denied to anon/authenticated
-- (security-definer RPCs run as table owner and bypass RLS)
