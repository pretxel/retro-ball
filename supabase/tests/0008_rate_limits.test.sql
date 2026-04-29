begin;
select plan(2);

do $$
declare a uuid;
begin
  select participant_id into a from public.create_room('Alice');
  perform set_config('test.alice', a::text, false);
end$$;

-- 30 cards in <1 min should be ok
do $$
declare i int;
begin
  for i in 1..30 loop
    perform public.add_card(current_setting('test.alice')::uuid, 'mad', 'card '||i);
  end loop;
end$$;
select is((select count(*)::int from public.cards), 30, '30 cards inserted');

-- 31st rejected
select throws_ok(
  $$ select public.add_card(current_setting('test.alice')::uuid, 'mad', 'overflow') $$,
  'P0001',
  'rate_limited',
  '31st card in same minute rejected'
);

select * from finish();
rollback;
