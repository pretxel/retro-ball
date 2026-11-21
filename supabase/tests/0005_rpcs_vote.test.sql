begin;
select plan(6);

do $$
declare a uuid; cid uuid;
begin
  select participant_id into a from public.rb_create_room('Alice');
  cid := (public.rb_add_card(a, 'mad', 'thing')).id;
  perform set_config('test.alice', a::text, false);
  perform set_config('test.card',  cid::text, false);
  -- shrink limit for test
  update public.rb_rooms set votes_per_user = 2 where facilitator_id = a;
end$$;

-- cast 2 votes ok
select isnt((select (public.rb_cast_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid)).id), null, 'first vote');
select isnt((select (public.rb_cast_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid)).id), null, 'second vote');

-- third rejected
select throws_ok(
  $$ select public.rb_cast_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid) $$,
  'P0001',
  'vote_limit_reached',
  'third vote rejected'
);

-- revoke one
do $$
begin
  perform public.rb_revoke_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid);
end$$;
select is(
  (select count(*)::int from public.rb_votes),
  1,
  'one vote remains after revoke'
);

-- can vote again now
select isnt((select (public.rb_cast_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid)).id), null, 'vote after revoke ok');

-- revoke without any votes -> no-op (no error)
do $$
declare bcid uuid;
begin
  bcid := (public.rb_add_card(current_setting('test.alice')::uuid, 'glad', 'other')).id;
  perform public.rb_revoke_vote(current_setting('test.alice')::uuid, bcid);
end$$;
select pass('revoke on no votes is a no-op');

select * from finish();
rollback;
