-- Realtime DELETE events filter on row payload. With default REPLICA IDENTITY,
-- only the primary key is in the DELETE payload, so non-PK filters
-- (room_id=eq.X) cannot match and DELETE events get dropped.
-- Switching to FULL makes Postgres include all columns in WAL for these tables.
alter table public.cards        replica identity full;
alter table public.votes        replica identity full;
alter table public.participants replica identity full;
-- rooms uses id=eq.X (PK) filter, default REPLICA IDENTITY is sufficient.
