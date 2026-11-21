create extension if not exists pgcrypto;

create table public.rb_rooms (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  template          text not null default 'mad-sad-glad',
  facilitator_id    uuid,
  anonymous_mode    boolean not null default false,
  votes_per_user    int not null default 5 check (votes_per_user between 1 and 20),
  authors_revealed  boolean not null default false,
  timer_started_at  timestamptz,
  timer_seconds     int check (timer_seconds is null or timer_seconds between 30 and 3600),
  ended_at          timestamptz,
  created_at        timestamptz not null default now(),
  last_activity_at  timestamptz not null default now()
);
create index rb_rooms_last_activity_idx on public.rb_rooms (last_activity_at);
create index rb_rooms_code_idx on public.rb_rooms (code);

create table public.rb_participants (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid not null references public.rb_rooms(id) on delete cascade,
  display_name    text not null check (length(display_name) between 1 and 40),
  is_facilitator  boolean not null default false,
  joined_at       timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);
create index rb_participants_room_idx on public.rb_participants (room_id);

alter table public.rb_rooms
  add constraint rooms_facilitator_fk
  foreign key (facilitator_id) references public.rb_participants(id) on delete set null;

create table public.rb_cards (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rb_rooms(id) on delete cascade,
  column_key  text not null check (column_key in ('mad','sad','glad')),
  author_id   uuid not null references public.rb_participants(id) on delete cascade,
  body        text not null check (length(body) between 1 and 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index rb_cards_room_idx on public.rb_cards (room_id);

create table public.rb_votes (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rb_rooms(id) on delete cascade,
  card_id     uuid not null references public.rb_cards(id) on delete cascade,
  voter_id    uuid not null references public.rb_participants(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index rb_votes_room_idx on public.rb_votes (room_id);
create index rb_votes_voter_idx on public.rb_votes (voter_id);
