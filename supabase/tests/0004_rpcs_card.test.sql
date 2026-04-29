begin;
select plan(9);

-- setup: room + 2 participants
do $$
declare a uuid; b uuid; r uuid;
begin
  select participant_id into a from public.create_room('Alice');
  select id into r from public.rooms limit 1;
  select participant_id into b from public.join_room((select code from public.rooms limit 1), 'Bob');
  perform set_config('test.alice', a::text, false);
  perform set_config('test.bob',   b::text, false);
  perform set_config('test.room',  r::text, false);
end$$;

-- add_card by Alice
select isnt(
  (select (public.add_card(current_setting('test.alice')::uuid, 'mad', 'broken build')).id),
  null,
  'add_card returns id'
);

-- card visible
select is(
  (select count(*)::int from public.cards),
  1,
  'one card exists'
);

-- empty body rejected
select throws_ok(
  $$ select public.add_card(current_setting('test.alice')::uuid, 'mad', '') $$,
  '23514',
  null,
  'empty body rejected'
);

-- bad column rejected
select throws_ok(
  $$ select public.add_card(current_setting('test.alice')::uuid, 'bogus', 'x') $$,
  '23514',
  null,
  'invalid column_key rejected'
);

-- edit_card by author succeeds
do $$
declare cid uuid;
begin
  select id into cid from public.cards limit 1;
  perform public.edit_card(current_setting('test.alice')::uuid, cid, 'CI broken');
end$$;
select is(
  (select body from public.cards limit 1),
  'CI broken',
  'edit_card updated body'
);

-- edit_card by non-author rejected
select throws_ok(
  $$ select public.edit_card(current_setting('test.bob')::uuid, (select id from public.cards limit 1), 'hax') $$,
  'P0001',
  'not_card_owner',
  'non-author cannot edit'
);

-- delete_card by non-author non-facilitator rejected
select throws_ok(
  $$ select public.delete_card(current_setting('test.bob')::uuid, (select id from public.cards limit 1)) $$,
  'P0001',
  'not_authorized',
  'non-owner non-facilitator cannot delete'
);

-- delete_card by facilitator (Alice) succeeds
do $$
begin
  perform public.delete_card(current_setting('test.alice')::uuid, (select id from public.cards limit 1));
end$$;
select is(
  (select count(*)::int from public.cards),
  0,
  'card deleted by facilitator'
);

-- last_activity_at bumped
select ok(
  (select last_activity_at > created_at from public.rooms limit 1),
  'activity bumped'
);

select * from finish();
rollback;
