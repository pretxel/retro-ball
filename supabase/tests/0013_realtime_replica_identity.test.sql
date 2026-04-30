begin;
select plan(3);

select is(
  (select relreplident from pg_class where oid = 'public.cards'::regclass),
  'f'::"char",
  'cards has REPLICA IDENTITY FULL'
);
select is(
  (select relreplident from pg_class where oid = 'public.votes'::regclass),
  'f'::"char",
  'votes has REPLICA IDENTITY FULL'
);
select is(
  (select relreplident from pg_class where oid = 'public.participants'::regclass),
  'f'::"char",
  'participants has REPLICA IDENTITY FULL'
);

select * from finish();
rollback;
