begin;
select plan(5);
select policies_are('public', 'rooms', array['rooms_select']::text[], 'rooms has only select policy');
select policies_are('public', 'cards', array['cards_select']::text[], 'cards has only select policy');
select policies_are('public', 'votes', array['votes_select']::text[], 'votes has only select policy');
select policies_are('public', 'participants', array['participants_select']::text[], 'participants has only select policy');
select is(
  (select rowsecurity from pg_tables where schemaname='public' and tablename='rooms'),
  true,
  'rls enabled on rooms'
);
select * from finish();
rollback;
