begin;
select plan(6);

do $$
declare a uuid; b uuid; c uuid; cid_alice uuid; cid_bob uuid;
begin
  select participant_id into a from public.rb_create_room('Alice');
  select participant_id into b from public.rb_join_room((select code from public.rb_rooms limit 1), 'Bob');
  select participant_id into c from public.rb_join_room((select code from public.rb_rooms limit 1), 'Charlie');
  cid_alice := (public.rb_add_card(a, 'mad', 'alice card')).id;
  cid_bob   := (public.rb_add_card(b, 'glad', 'bob card')).id;
  perform public.rb_set_anonymous_mode(a, true);
  perform set_config('test.alice', a::text, false);
  perform set_config('test.bob',   b::text, false);
  perform set_config('test.charlie', c::text, false);
  perform set_config('test.cid_alice', cid_alice::text, false);
  perform set_config('test.cid_bob',   cid_bob::text, false);
end$$;

-- Alice viewing: sees own card author, bob's card redacted
select is(
  (select author_id from public.rb_cards_visible(current_setting('test.alice')::uuid) where id = current_setting('test.cid_alice')::uuid),
  current_setting('test.alice')::uuid,
  'alice sees own author_id on own card'
);
select is(
  (select author_id from public.rb_cards_visible(current_setting('test.alice')::uuid) where id = current_setting('test.cid_bob')::uuid),
  null,
  'alice sees null on bob card'
);

-- Bob viewing: sees own card author, alice's card redacted
select is(
  (select author_id from public.rb_cards_visible(current_setting('test.bob')::uuid) where id = current_setting('test.cid_bob')::uuid),
  current_setting('test.bob')::uuid,
  'bob sees own author_id on own card'
);
select is(
  (select author_id from public.rb_cards_visible(current_setting('test.bob')::uuid) where id = current_setting('test.cid_alice')::uuid),
  null,
  'bob sees null on alice card'
);

-- Charlie (third party): both cards redacted
select is(
  (select author_id from public.rb_cards_visible(current_setting('test.charlie')::uuid) where id = current_setting('test.cid_alice')::uuid),
  null,
  'charlie sees null on alice card'
);
select is(
  (select author_id from public.rb_cards_visible(current_setting('test.charlie')::uuid) where id = current_setting('test.cid_bob')::uuid),
  null,
  'charlie sees null on bob card'
);

select * from finish();
rollback;
