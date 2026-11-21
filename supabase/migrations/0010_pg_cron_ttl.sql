-- pg_cron extension already enabled in 0000_extensions.sql with schema = extensions

create or replace function public.rb_purge_stale_rooms()
returns int language sql security definer set search_path = public as $$
  with deleted as (
    delete from public.rb_rooms
    where last_activity_at < now() - interval '24 hours'
    returning 1
  )
  select count(*)::int from deleted;
$$;

grant execute on function public.rb_purge_stale_rooms() to anon, authenticated;

-- schedule hourly (idempotent)
do $$
begin
  perform cron.schedule('rb_purge_stale_rooms_hourly', '0 * * * *', $cron$ select public.rb_purge_stale_rooms(); $cron$);
exception when others then
  -- ignore re-schedule conflict in tests / re-runs
  null;
end$$;
