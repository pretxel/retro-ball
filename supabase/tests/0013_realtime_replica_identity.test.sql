begin;
select plan(3);

select is(
  (select relreplident from pg_class where oid = 'public.rb_cards'::regclass),
  'f'::"char",
  'cards has REPLICA IDENTITY FULL'
);
select is(
  (select relreplident from pg_class where oid = 'public.rb_votes'::regclass),
  'f'::"char",
  'votes has REPLICA IDENTITY FULL'
);
select is(
  (select relreplident from pg_class where oid = 'public.rb_participants'::regclass),
  'f'::"char",
  'participants has REPLICA IDENTITY FULL'
);

select * from finish();
rollback;
