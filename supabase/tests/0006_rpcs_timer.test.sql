begin;
select plan(4);

do $$
declare a uuid; b uuid; rid uuid;
begin
  select participant_id, room_id into a, rid from public.rb_create_room('Alice');
  select participant_id into b from public.rb_join_room((select code from public.rb_rooms limit 1), 'Bob');
  perform set_config('test.alice', a::text, false);
  perform set_config('test.bob',   b::text, false);
  perform set_config('test.room',  rid::text, false);
end$$;

-- non-facilitator cannot start
select throws_ok(
  $$ select public.rb_start_timer(current_setting('test.bob')::uuid, 300) $$,
  'P0001',
  'not_facilitator',
  'non-facilitator cannot start timer'
);

-- facilitator can start
do $$
begin
  perform public.rb_start_timer(current_setting('test.alice')::uuid, 300);
end$$;
select isnt(
  (select timer_started_at from public.rb_rooms where id = current_setting('test.room')::uuid),
  null,
  'timer started'
);
select is(
  (select timer_seconds from public.rb_rooms where id = current_setting('test.room')::uuid),
  300,
  'timer seconds set'
);

-- stop clears
do $$
begin
  perform public.rb_stop_timer(current_setting('test.alice')::uuid);
end$$;
select is(
  (select timer_started_at from public.rb_rooms where id = current_setting('test.room')::uuid),
  null,
  'timer cleared'
);

select * from finish();
rollback;
