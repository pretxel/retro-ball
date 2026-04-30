-- Enable Supabase Realtime for live-sync tables.
-- postgres_changes subscriptions require these tables in the publication.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.participants;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.votes;
