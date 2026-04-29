begin;
select plan(2);

do $$
declare a uuid; b uuid; cid uuid;
begin
  select participant_id into a from public.create_room('Alice');
  select participant_id into b from public.join_room((select code from public.rooms limit 1), 'Bob');
  cid := (public.add_card(a, 'mad', 'secret')).id;
  perform public.set_anonymous_mode(a, true);
  perform set_config('test.alice', a::text, false);
  perform set_config('test.bob',   b::text, false);
end$$;

-- view: alice sees own author_id
select is(
  (select author_id from public.cards_visible(current_setting('test.alice')::uuid)),
  current_setting('test.alice')::uuid,
  'author sees own id'
);

-- view: bob sees null author_id when anon and not revealed
select is(
  (select author_id from public.cards_visible(current_setting('test.bob')::uuid)),
  null,
  'non-author sees null author_id'
);

select * from finish();
rollback;
