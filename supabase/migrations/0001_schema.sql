create extension if not exists pgcrypto;

create table public.rooms (
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
create index rooms_last_activity_idx on public.rooms (last_activity_at);
create index rooms_code_idx on public.rooms (code);

create table public.participants (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid not null references public.rooms(id) on delete cascade,
  display_name    text not null check (length(display_name) between 1 and 40),
  is_facilitator  boolean not null default false,
  joined_at       timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);
create index participants_room_idx on public.participants (room_id);

alter table public.rooms
  add constraint rooms_facilitator_fk
  foreign key (facilitator_id) references public.participants(id) on delete set null;

create table public.cards (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  column_key  text not null check (column_key in ('mad','sad','glad')),
  author_id   uuid not null references public.participants(id) on delete cascade,
  body        text not null check (length(body) between 1 and 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index cards_room_idx on public.cards (room_id);

create table public.votes (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  card_id     uuid not null references public.cards(id) on delete cascade,
  voter_id    uuid not null references public.participants(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index votes_room_idx on public.votes (room_id);
create index votes_voter_idx on public.votes (voter_id);
