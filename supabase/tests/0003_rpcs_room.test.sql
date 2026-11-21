begin;
select plan(10);

-- create_room returns room_id, code, participant_id
select isnt(
  (select (rb_create_room('Alice')).room_id),
  null,
  'create_room returns a room id'
);

-- code is 6 digits
select matches(
  (select code from public.rb_rooms limit 1),
  '^[0-9]{6}$',
  'room code is 6 digits'
);

-- creator is facilitator
select is(
  (select is_facilitator from public.rb_participants order by joined_at desc limit 1),
  true,
  'creator is facilitator'
);

-- room.facilitator_id matches creator
select is(
  (select facilitator_id from public.rb_rooms limit 1),
  (select id from public.rb_participants order by joined_at desc limit 1),
  'rooms.facilitator_id matches creator participant'
);

-- join_room with valid code creates participant
do $$
declare r record;
begin
  select code into r from public.rb_rooms limit 1;
  perform public.rb_join_room(r.code, 'Bob');
end$$;
select is(
  (select count(*)::int from public.rb_participants),
  2,
  'join_room created second participant'
);

-- joined participant is not facilitator
select is(
  (select is_facilitator from public.rb_participants where display_name='Bob'),
  false,
  'joiner is not facilitator'
);

-- join_room with bad code raises
select throws_ok(
  $$ select public.rb_join_room('000000', 'Eve') $$,
  'P0001',
  'room_not_found',
  'join_room rejects unknown code'
);

-- get_room_state returns full snapshot
select isnt(
  (select (public.rb_get_room_state((select id from public.rb_rooms limit 1))).room),
  null,
  'get_room_state returns room'
);

-- bumps last_activity_at on join
select ok(
  (select last_activity_at > created_at from public.rb_rooms limit 1),
  'last_activity_at advanced past created_at after join'
);

-- create_room rejects empty name
select throws_ok(
  $$ select public.rb_create_room('') $$,
  '23514',
  null,
  'create_room rejects empty display name'
);

select * from finish();
rollback;
