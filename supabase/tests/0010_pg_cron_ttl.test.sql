begin;
select plan(2);

-- create a room and back-date last_activity_at
do $$
declare a uuid; rid uuid;
begin
  select participant_id, room_id into a, rid from public.rb_create_room('Alice');
  update public.rb_rooms set last_activity_at = now() - interval '2 days' where id = rid;
end$$;
select is((select count(*)::int from public.rb_rooms), 1, 'one room exists');

-- run cleanup
select public.rb_purge_stale_rooms();
select is((select count(*)::int from public.rb_rooms), 0, 'stale room purged');

select * from finish();
rollback;
