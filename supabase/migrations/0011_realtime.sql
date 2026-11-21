-- Enable Supabase Realtime for live-sync tables.
-- postgres_changes subscriptions require these tables in the publication.
alter publication supabase_realtime add table public.rb_rooms;
alter publication supabase_realtime add table public.rb_participants;
alter publication supabase_realtime add table public.rb_cards;
alter publication supabase_realtime add table public.rb_votes;
