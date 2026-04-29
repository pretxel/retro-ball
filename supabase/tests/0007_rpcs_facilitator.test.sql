begin;
select plan(7);

do $$
declare a uuid; b uuid; rid uuid;
begin
  select participant_id, room_id into a, rid from public.create_room('Alice');
  select participant_id into b from public.join_room((select code from public.rooms limit 1), 'Bob');
  perform set_config('test.alice', a::text, false);
  perform set_config('test.bob',   b::text, false);
  perform set_config('test.room',  rid::text, false);
end$$;

-- non-facilitator denied
select throws_ok(
  $$ select public.set_anonymous_mode(current_setting('test.bob')::uuid, true) $$,
  'P0001',
  'not_facilitator',
  'non-facilitator denied'
);

-- facilitator turns on anon
do $$ begin perform public.set_anonymous_mode(current_setting('test.alice')::uuid, true); end$$;
select is(
  (select anonymous_mode from public.rooms where id = current_setting('test.room')::uuid),
  true,
  'anon on'
);
select is(
  (select authors_revealed from public.rooms where id = current_setting('test.room')::uuid),
  false,
  'reveal reset to false when turning anon on'
);

-- reveal_authors
do $$ begin perform public.reveal_authors(current_setting('test.alice')::uuid); end$$;
select is(
  (select authors_revealed from public.rooms where id = current_setting('test.room')::uuid),
  true,
  'authors revealed'
);

-- set_votes_per_user validates range
select throws_ok(
  $$ select public.set_votes_per_user(current_setting('test.alice')::uuid, 100) $$,
  'P0001',
  'invalid_votes_per_user',
  'votes_per_user out of range'
);

-- set_votes_per_user works
do $$ begin perform public.set_votes_per_user(current_setting('test.alice')::uuid, 3); end$$;
select is(
  (select votes_per_user from public.rooms where id = current_setting('test.room')::uuid),
  3,
  'votes_per_user updated'
);

-- end_room
do $$ begin perform public.end_room(current_setting('test.alice')::uuid); end$$;
select isnt(
  (select ended_at from public.rooms where id = current_setting('test.room')::uuid),
  null,
  'room ended'
);

select * from finish();
rollback;
