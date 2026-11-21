begin;
select plan(2);

do $$
declare a uuid; cid uuid;
begin
  select participant_id into a from public.rb_create_room('Alice');
  cid := (public.rb_add_card(a, 'mad', 'thing')).id;
  perform public.rb_cast_vote(a, cid);
  perform public.rb_end_room(a);
  perform set_config('test.alice', a::text, false);
  perform set_config('test.card',  cid::text, false);
end$$;

select throws_ok(
  $$ select public.rb_delete_card(current_setting('test.alice')::uuid, current_setting('test.card')::uuid) $$,
  'P0001',
  'room_ended',
  'delete_card rejects after room ended'
);

select throws_ok(
  $$ select public.rb_revoke_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid) $$,
  'P0001',
  'room_ended',
  'revoke_vote rejects after room ended'
);

select * from finish();
rollback;
