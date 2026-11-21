begin;
select plan(8);

select ok(has_table_privilege('anon', 'public.rb_rooms', 'select'), 'anon can select rooms');
select ok(has_table_privilege('anon', 'public.rb_participants', 'select'), 'anon can select participants');
select ok(has_table_privilege('anon', 'public.rb_cards', 'select'), 'anon can select cards');
select ok(has_table_privilege('anon', 'public.rb_votes', 'select'), 'anon can select votes');
select ok(has_table_privilege('authenticated', 'public.rb_rooms', 'select'), 'authenticated can select rooms');
select ok(has_table_privilege('authenticated', 'public.rb_participants', 'select'), 'authenticated can select participants');
select ok(has_table_privilege('authenticated', 'public.rb_cards', 'select'), 'authenticated can select cards');
select ok(has_table_privilege('authenticated', 'public.rb_votes', 'select'), 'authenticated can select votes');

select * from finish();
rollback;
