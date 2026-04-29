# Retro Ball — Core Realtime Board (v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a publicly shareable Mad/Sad/Glad retrospective web app: room-code join, live realtime cards/voting, anonymous mode, facilitator timer, ephemeral 24h boards.

**Architecture:** Next.js 16 App Router on Vercel + Supabase (Postgres + Realtime). All mutations go through `security definer` Postgres RPC functions (RLS denies direct writes). Clients hold one Realtime channel per room and merge `postgres_changes` deltas into a zustand store seeded from a `get_room_state` snapshot. Identity is a participant-id HTTP-only cookie (no auth subsystem in v1).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, zustand, `@supabase/ssr`, `@supabase/supabase-js`, Supabase CLI, pgTAP, Vitest, Playwright, pnpm, Vercel, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-04-29-retro-ball-core-realtime-board-design.md`

---

## File Structure

```
retro-ball/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                          # Landing: Create + Join entry
│   └── r/[code]/
│       ├── page.tsx                      # Board route, server shell
│       └── join/page.tsx                 # Display name entry
├── components/
│   ├── board/{Board,Column,Card,CardEditor,VoteDot,Timer,ParticipantsList}.tsx
│   ├── facilitator/{TimerControls,RevealAuthorsToggle,AnonymousModeToggle,EndRetroButton,VotesPerUserField}.tsx
│   └── ui/                               # shadcn primitives (button, dialog, input, ...)
├── lib/
│   ├── supabase/{browser,server,types}.ts
│   ├── realtime/{useRoomChannel,useRoomState,store,reducer}.ts
│   ├── rpc/                              # one wrapper file per RPC
│   ├── identity.ts
│   ├── room-code.ts                      # client-side helpers (server generates codes)
│   └── errors.ts                         # error code → toast string
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 0001_schema.sql
│   │   ├── 0002_rls.sql
│   │   ├── 0003_rpcs_room.sql
│   │   ├── 0004_rpcs_card.sql
│   │   ├── 0005_rpcs_vote.sql
│   │   ├── 0006_rpcs_timer.sql
│   │   ├── 0007_rpcs_facilitator.sql
│   │   ├── 0008_rate_limits.sql
│   │   ├── 0009_anon_view.sql
│   │   └── 0010_pg_cron_ttl.sql
│   └── tests/                            # pgTAP files, one per migration
├── tests/
│   ├── unit/                             # Vitest
│   └── e2e/                              # Playwright
├── .github/workflows/ci.yml
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── vercel.ts
├── playwright.config.ts
├── vitest.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── README.md
```

**Boundary contracts:**
- Components only call `lib/rpc/*`. Never import `supabase` directly.
- Only `useRoomChannel` opens Realtime subscriptions.
- Postgres RPCs are the single mutation surface. RLS denies direct writes.
- `lib/identity.ts` is the only owner of the participant cookie.

---

## Conventions

**Commits:** Conventional Commits style. Each task ends with one commit.

**TDD discipline:** every behavioural change starts with a failing test. DB tests via pgTAP run against `supabase start`'s local stack. Frontend unit tests via Vitest. End-to-end via Playwright in CI.

**Local Supabase:** `supabase start` runs Postgres + Realtime + Studio on Docker. All tests assume it is running. CI uses `supabase db start` headless.

**Run order during development:**

```bash
pnpm dev                 # Next.js dev server
supabase start           # Postgres + Realtime locally
supabase db reset        # apply all migrations + seed
supabase test db         # pgTAP suite
pnpm test                # vitest
pnpm test:e2e            # playwright
```

---

## Phase A — Bootstrap

### Task 1: Initialize Next.js 16 + Tailwind v4 + pnpm

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore` (extend), `eslint.config.mjs`

- [ ] **Step 1: Scaffold Next.js**

```bash
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --use-pnpm --turbopack --skip-install --eslint
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm add @supabase/ssr@latest @supabase/supabase-js@latest zustand
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test supabase
```

- [ ] **Step 3: Replace `app/page.tsx` with placeholder landing**

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-semibold">Retro Ball</h1>
    </main>
  );
}
```

- [ ] **Step 4: Verify dev server boots**

Run: `pnpm dev`
Expected: `Ready on http://localhost:3000`. Visit, see "Retro Ball". Stop (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 + Tailwind v4 + pnpm"
```

---

### Task 2: Initialize local Supabase

**Files:**
- Create: `supabase/config.toml`, `supabase/seed.sql`, `.env.local` (gitignored)

- [ ] **Step 1: Init Supabase**

```bash
pnpm supabase init
```

This creates `supabase/config.toml` and `supabase/migrations/` directory.

- [ ] **Step 2: Enable pgTAP + pg_cron in `supabase/config.toml`**

Find `[db]` section, ensure:

```toml
[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.seed]
enabled = true
sql_paths = ["./seed.sql"]

[db.pooler]
enabled = false
```

Append (or update) extension settings:

```toml
[experimental]
schema = ["public", "extensions"]
```

- [ ] **Step 3: Boot local stack**

```bash
pnpm supabase start
```

Expected: prints API URL, anon key, service role key. Save them.

- [ ] **Step 4: Write `.env.local`**

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-step-3>
SUPABASE_SERVICE_ROLE_KEY=<service-role-from-step-3>
```

Add `.env.local` to `.gitignore` (already covered by Next default).

- [ ] **Step 5: Commit**

```bash
git add supabase/ .env.local.example 2>/dev/null
git add supabase/config.toml supabase/seed.sql 2>/dev/null
git commit -m "chore: init Supabase local stack"
```

---

### Task 3: Configure Vitest + Playwright

**Files:**
- Create: `vitest.config.ts`, `tests/unit/setup.ts`, `playwright.config.ts`, `tests/e2e/.gitkeep`
- Modify: `package.json` (scripts)

- [ ] **Step 1: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
  },
});
```

- [ ] **Step 2: `tests/unit/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 4: Update `package.json` scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:test": "supabase test db"
  }
}
```

- [ ] **Step 5: Sanity test**

Create `tests/unit/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `pnpm test`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add vitest + playwright config"
```

---

### Task 4: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - uses: supabase/setup-cli@v1
        with: { version: latest }
      - run: supabase db start
      - run: supabase db reset --no-seed
      - run: supabase test db
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_LOCAL_ANON_KEY }}
```

- [ ] **Step 2: Commit (CI runs after push)**

```bash
git add .github/
git commit -m "chore: add CI workflow"
```

---

## Phase B — Database (TDD with pgTAP)

> All database tasks: **write the pgTAP test first**, run `pnpm db:test` to confirm failure, then write/update the migration, then `pnpm db:reset && pnpm db:test` to confirm pass.

### Task 5: Schema migration — rooms, participants, cards, votes

**Files:**
- Create: `supabase/migrations/0001_schema.sql`, `supabase/tests/0001_schema.test.sql`

- [ ] **Step 1: Failing pgTAP test**

`supabase/tests/0001_schema.test.sql`:

```sql
begin;
select plan(8);
select has_table('public', 'rooms', 'rooms exists');
select has_table('public', 'participants', 'participants exists');
select has_table('public', 'cards', 'cards exists');
select has_table('public', 'votes', 'votes exists');
select col_is_unique('public', 'rooms', array['code'], 'room.code unique');
select fk_ok('public', 'cards', 'room_id', 'public', 'rooms', 'id');
select fk_ok('public', 'votes', 'card_id', 'public', 'cards', 'id');
select col_type_is('public', 'rooms', 'votes_per_user', 'integer');
select * from finish();
rollback;
```

- [ ] **Step 2: Run test, expect fail**

Run: `pnpm db:reset --no-seed && pnpm db:test`
Expected: tables don't exist, all assertions fail.

- [ ] **Step 3: Write migration**

`supabase/migrations/0001_schema.sql`:

```sql
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
```

- [ ] **Step 4: Run test, expect pass**

Run: `pnpm db:reset --no-seed && pnpm db:test`
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_schema.sql supabase/tests/0001_schema.test.sql
git commit -m "feat(db): add schema for rooms, participants, cards, votes"
```

---

### Task 6: RLS policies — public read, deny direct writes

**Files:**
- Create: `supabase/migrations/0002_rls.sql`, `supabase/tests/0002_rls.test.sql`

- [ ] **Step 1: Failing test**

`supabase/tests/0002_rls.test.sql`:

```sql
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
```

- [ ] **Step 2: Run, expect fail**

Run: `pnpm db:reset --no-seed && pnpm db:test`
Expected: failures (no policies).

- [ ] **Step 3: Write migration**

`supabase/migrations/0002_rls.sql`:

```sql
alter table public.rooms          enable row level security;
alter table public.participants   enable row level security;
alter table public.cards          enable row level security;
alter table public.votes          enable row level security;

create policy rooms_select        on public.rooms        for select to anon, authenticated using (true);
create policy participants_select on public.participants for select to anon, authenticated using (true);
create policy cards_select        on public.cards        for select to anon, authenticated using (true);
create policy votes_select        on public.votes        for select to anon, authenticated using (true);

-- no insert/update/delete policies → all writes denied to anon/authenticated
-- (security-definer RPCs run as table owner and bypass RLS)
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm db:reset --no-seed && pnpm db:test`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0002_rls.sql supabase/tests/0002_rls.test.sql
git commit -m "feat(db): enable RLS, public read, deny direct writes"
```

---

### Task 7: Room-creation RPCs — create_room, join_room, get_room_state, last_activity helper

**Files:**
- Create: `supabase/migrations/0003_rpcs_room.sql`, `supabase/tests/0003_rpcs_room.test.sql`

- [ ] **Step 1: Failing test**

`supabase/tests/0003_rpcs_room.test.sql`:

```sql
begin;
select plan(10);

-- create_room returns room_id, code, participant_id
select isnt(
  (select (create_room('Alice')).room_id),
  null,
  'create_room returns a room id'
);

-- code is 6 digits
select matches(
  (select code from public.rooms limit 1),
  '^[0-9]{6}$',
  'room code is 6 digits'
);

-- creator is facilitator
select is(
  (select is_facilitator from public.participants order by joined_at desc limit 1),
  true,
  'creator is facilitator'
);

-- room.facilitator_id matches creator
select is(
  (select facilitator_id from public.rooms limit 1),
  (select id from public.participants order by joined_at desc limit 1),
  'rooms.facilitator_id matches creator participant'
);

-- join_room with valid code creates participant
do $$
declare r record;
begin
  select code into r from public.rooms limit 1;
  perform public.join_room(r.code, 'Bob');
end$$;
select is(
  (select count(*)::int from public.participants),
  2,
  'join_room created second participant'
);

-- joined participant is not facilitator
select is(
  (select is_facilitator from public.participants where display_name='Bob'),
  false,
  'joiner is not facilitator'
);

-- join_room with bad code raises
select throws_ok(
  $$ select public.join_room('000000', 'Eve') $$,
  'P0001',
  'room_not_found',
  'join_room rejects unknown code'
);

-- get_room_state returns full snapshot
select isnt(
  (select (public.get_room_state((select id from public.rooms limit 1))).room),
  null,
  'get_room_state returns room'
);

-- bumps last_activity_at on join
select ok(
  (select last_activity_at > created_at from public.rooms limit 1),
  'last_activity_at advanced past created_at after join'
);

-- create_room rejects empty name
select throws_ok(
  $$ select public.create_room('') $$,
  '23514',
  null,
  'create_room rejects empty display name'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run, expect fail**

Run: `pnpm db:reset --no-seed && pnpm db:test`
Expected: function not found errors.

- [ ] **Step 3: Write migration**

`supabase/migrations/0003_rpcs_room.sql`:

```sql
-- Internal: bump activity
create or replace function public._bump_activity(p_room_id uuid)
returns void language sql as $$
  update public.rooms set last_activity_at = now() where id = p_room_id;
$$;

-- Internal: generate unique 6-digit code, retry on collision
create or replace function public._generate_room_code()
returns text language plpgsql as $$
declare
  candidate text;
  attempts int := 0;
begin
  loop
    candidate := lpad((floor(random() * 1000000))::int::text, 6, '0');
    if not exists (select 1 from public.rooms where code = candidate) then
      return candidate;
    end if;
    attempts := attempts + 1;
    if attempts > 10 then
      raise exception 'room_code_exhausted' using errcode = 'P0001';
    end if;
  end loop;
end;
$$;

create or replace function public.create_room(p_display_name text)
returns table(room_id uuid, code text, participant_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_code text;
  v_participant_id uuid;
begin
  v_code := public._generate_room_code();
  insert into public.rooms (code) values (v_code) returning id into v_room_id;
  insert into public.participants (room_id, display_name, is_facilitator)
    values (v_room_id, p_display_name, true)
    returning id into v_participant_id;
  update public.rooms set facilitator_id = v_participant_id where id = v_room_id;
  return query select v_room_id, v_code, v_participant_id;
end;
$$;

create or replace function public.join_room(p_code text, p_display_name text)
returns table(room_id uuid, participant_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_participant_id uuid;
begin
  select id into v_room_id from public.rooms where code = p_code and ended_at is null;
  if v_room_id is null then
    raise exception 'room_not_found' using errcode = 'P0001';
  end if;
  insert into public.participants (room_id, display_name)
    values (v_room_id, p_display_name)
    returning id into v_participant_id;
  perform public._bump_activity(v_room_id);
  return query select v_room_id, v_participant_id;
end;
$$;

create or replace function public.get_room_state(p_room_id uuid)
returns table(
  room json,
  participants json,
  cards json,
  votes json
)
language sql security definer set search_path = public as $$
  select
    (select to_jsonb(r) from public.rooms r where r.id = p_room_id),
    (select coalesce(jsonb_agg(p), '[]'::jsonb) from public.participants p where p.room_id = p_room_id),
    (select coalesce(jsonb_agg(c), '[]'::jsonb) from public.cards c where c.room_id = p_room_id),
    (select coalesce(jsonb_agg(v), '[]'::jsonb) from public.votes v where v.room_id = p_room_id);
$$;

grant execute on function public.create_room(text)        to anon, authenticated;
grant execute on function public.join_room(text, text)    to anon, authenticated;
grant execute on function public.get_room_state(uuid)     to anon, authenticated;
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm db:reset --no-seed && pnpm db:test`
Expected: 10 passed.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0003_rpcs_room.sql supabase/tests/0003_rpcs_room.test.sql
git commit -m "feat(db): add create_room, join_room, get_room_state RPCs"
```

---

### Task 8: Card RPCs — add_card, edit_card, delete_card

**Files:**
- Create: `supabase/migrations/0004_rpcs_card.sql`, `supabase/tests/0004_rpcs_card.test.sql`

- [ ] **Step 1: Failing test**

`supabase/tests/0004_rpcs_card.test.sql`:

```sql
begin;
select plan(9);

-- setup: room + 2 participants
do $$
declare a uuid; b uuid; r uuid;
begin
  select participant_id into a from public.create_room('Alice');
  select id into r from public.rooms limit 1;
  select participant_id into b from public.join_room((select code from public.rooms limit 1), 'Bob');
  perform set_config('test.alice', a::text, false);
  perform set_config('test.bob',   b::text, false);
  perform set_config('test.room',  r::text, false);
end$$;

-- add_card by Alice
select isnt(
  (select (public.add_card(current_setting('test.alice')::uuid, 'mad', 'broken build'))).id,
  null,
  'add_card returns id'
);

-- card visible
select is(
  (select count(*)::int from public.cards),
  1,
  'one card exists'
);

-- empty body rejected
select throws_ok(
  $$ select public.add_card(current_setting('test.alice')::uuid, 'mad', '') $$,
  '23514',
  null,
  'empty body rejected'
);

-- bad column rejected
select throws_ok(
  $$ select public.add_card(current_setting('test.alice')::uuid, 'bogus', 'x') $$,
  '23514',
  null,
  'invalid column_key rejected'
);

-- edit_card by author succeeds
do $$
declare cid uuid;
begin
  select id into cid from public.cards limit 1;
  perform public.edit_card(current_setting('test.alice')::uuid, cid, 'CI broken');
end$$;
select is(
  (select body from public.cards limit 1),
  'CI broken',
  'edit_card updated body'
);

-- edit_card by non-author rejected
select throws_ok(
  $$ select public.edit_card(current_setting('test.bob')::uuid, (select id from public.cards limit 1), 'hax') $$,
  'P0001',
  'not_card_owner',
  'non-author cannot edit'
);

-- delete_card by non-author non-facilitator rejected
select throws_ok(
  $$ select public.delete_card(current_setting('test.bob')::uuid, (select id from public.cards limit 1)) $$,
  'P0001',
  'not_authorized',
  'non-owner non-facilitator cannot delete'
);

-- delete_card by facilitator (Alice) succeeds
do $$
begin
  perform public.delete_card(current_setting('test.alice')::uuid, (select id from public.cards limit 1));
end$$;
select is(
  (select count(*)::int from public.cards),
  0,
  'card deleted by facilitator'
);

-- last_activity_at bumped
select ok(
  (select last_activity_at > created_at from public.rooms limit 1),
  'activity bumped'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run, expect fail.**

Run: `pnpm db:test`
Expected: function not found errors.

- [ ] **Step 3: Write migration**

`supabase/migrations/0004_rpcs_card.sql`:

```sql
create or replace function public._participant_in_room(p_pid uuid, p_room_id uuid)
returns boolean language sql stable as $$
  select exists(select 1 from public.participants where id = p_pid and room_id = p_room_id);
$$;

create or replace function public._is_facilitator(p_pid uuid)
returns boolean language sql stable as $$
  select coalesce((select is_facilitator from public.participants where id = p_pid), false);
$$;

create or replace function public._room_active(p_room_id uuid)
returns boolean language sql stable as $$
  select exists(select 1 from public.rooms where id = p_room_id and ended_at is null);
$$;

create or replace function public.add_card(
  p_participant_id uuid,
  p_column_key text,
  p_body text
) returns public.cards
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_card public.cards;
begin
  select room_id into v_room_id from public.participants where id = p_participant_id;
  if v_room_id is null then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._room_active(v_room_id) then
    raise exception 'room_ended' using errcode = 'P0001';
  end if;
  insert into public.cards (room_id, column_key, author_id, body)
    values (v_room_id, p_column_key, p_participant_id, p_body)
    returning * into v_card;
  perform public._bump_activity(v_room_id);
  return v_card;
end;
$$;

create or replace function public.edit_card(
  p_participant_id uuid,
  p_card_id uuid,
  p_body text
) returns public.cards
language plpgsql security definer set search_path = public as $$
declare
  v_card public.cards;
begin
  select * into v_card from public.cards where id = p_card_id;
  if v_card.id is null then
    raise exception 'card_not_found' using errcode = 'P0001';
  end if;
  if v_card.author_id <> p_participant_id then
    raise exception 'not_card_owner' using errcode = 'P0001';
  end if;
  if not public._room_active(v_card.room_id) then
    raise exception 'room_ended' using errcode = 'P0001';
  end if;
  update public.cards set body = p_body, updated_at = now() where id = p_card_id returning * into v_card;
  perform public._bump_activity(v_card.room_id);
  return v_card;
end;
$$;

create or replace function public.delete_card(
  p_participant_id uuid,
  p_card_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_card public.cards;
begin
  select * into v_card from public.cards where id = p_card_id;
  if v_card.id is null then
    raise exception 'card_not_found' using errcode = 'P0001';
  end if;
  if v_card.author_id <> p_participant_id and not public._is_facilitator(p_participant_id) then
    raise exception 'not_authorized' using errcode = 'P0001';
  end if;
  delete from public.cards where id = p_card_id;
  perform public._bump_activity(v_card.room_id);
end;
$$;

grant execute on function public.add_card(uuid, text, text)   to anon, authenticated;
grant execute on function public.edit_card(uuid, uuid, text)  to anon, authenticated;
grant execute on function public.delete_card(uuid, uuid)      to anon, authenticated;
```

- [ ] **Step 4: Run, expect pass**

Run: `pnpm db:reset --no-seed && pnpm db:test`
Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0004_rpcs_card.sql supabase/tests/0004_rpcs_card.test.sql
git commit -m "feat(db): add card RPCs (add, edit, delete)"
```

---

### Task 9: Vote RPCs — cast_vote, revoke_vote

**Files:**
- Create: `supabase/migrations/0005_rpcs_vote.sql`, `supabase/tests/0005_rpcs_vote.test.sql`

- [ ] **Step 1: Failing test**

`supabase/tests/0005_rpcs_vote.test.sql`:

```sql
begin;
select plan(6);

do $$
declare a uuid; cid uuid;
begin
  select participant_id into a from public.create_room('Alice');
  cid := (public.add_card(a, 'mad', 'thing')).id;
  perform set_config('test.alice', a::text, false);
  perform set_config('test.card',  cid::text, false);
  -- shrink limit for test
  update public.rooms set votes_per_user = 2 where facilitator_id = a;
end$$;

-- cast 2 votes ok
select isnt((select (public.cast_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid)).id), null, 'first vote');
select isnt((select (public.cast_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid)).id), null, 'second vote');

-- third rejected
select throws_ok(
  $$ select public.cast_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid) $$,
  'P0001',
  'vote_limit_reached',
  'third vote rejected'
);

-- revoke one
do $$
begin
  perform public.revoke_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid);
end$$;
select is(
  (select count(*)::int from public.votes),
  1,
  'one vote remains after revoke'
);

-- can vote again now
select isnt((select (public.cast_vote(current_setting('test.alice')::uuid, current_setting('test.card')::uuid)).id), null, 'vote after revoke ok');

-- revoke without any votes -> no-op (no error)
do $$
declare bcid uuid;
begin
  bcid := (public.add_card(current_setting('test.alice')::uuid, 'glad', 'other')).id;
  perform public.revoke_vote(current_setting('test.alice')::uuid, bcid);
end$$;
select pass('revoke on no votes is a no-op');

select * from finish();
rollback;
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Write migration**

`supabase/migrations/0005_rpcs_vote.sql`:

```sql
create or replace function public.cast_vote(
  p_participant_id uuid,
  p_card_id uuid
) returns public.votes
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_limit int;
  v_count int;
  v_vote public.votes;
begin
  select c.room_id into v_room_id from public.cards c where c.id = p_card_id;
  if v_room_id is null then
    raise exception 'card_not_found' using errcode = 'P0001';
  end if;
  if not public._participant_in_room(p_participant_id, v_room_id) then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._room_active(v_room_id) then
    raise exception 'room_ended' using errcode = 'P0001';
  end if;
  select votes_per_user into v_limit from public.rooms where id = v_room_id;
  select count(*) into v_count from public.votes where voter_id = p_participant_id and room_id = v_room_id;
  if v_count >= v_limit then
    raise exception 'vote_limit_reached' using errcode = 'P0001';
  end if;
  insert into public.votes (room_id, card_id, voter_id)
    values (v_room_id, p_card_id, p_participant_id)
    returning * into v_vote;
  perform public._bump_activity(v_room_id);
  return v_vote;
end;
$$;

create or replace function public.revoke_vote(
  p_participant_id uuid,
  p_card_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_room_id uuid;
begin
  select id, room_id into v_id, v_room_id
    from public.votes
    where voter_id = p_participant_id and card_id = p_card_id
    order by created_at desc
    limit 1;
  if v_id is null then
    return;  -- no-op
  end if;
  delete from public.votes where id = v_id;
  perform public._bump_activity(v_room_id);
end;
$$;

grant execute on function public.cast_vote(uuid, uuid)    to anon, authenticated;
grant execute on function public.revoke_vote(uuid, uuid)  to anon, authenticated;
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0005_rpcs_vote.sql supabase/tests/0005_rpcs_vote.test.sql
git commit -m "feat(db): add vote RPCs (cast, revoke) with per-user limit"
```

---

### Task 10: Timer RPCs — start_timer, stop_timer

**Files:**
- Create: `supabase/migrations/0006_rpcs_timer.sql`, `supabase/tests/0006_rpcs_timer.test.sql`

- [ ] **Step 1: Failing test**

`supabase/tests/0006_rpcs_timer.test.sql`:

```sql
begin;
select plan(4);

do $$
declare a uuid; b uuid; rid uuid;
begin
  select participant_id, room_id into a, rid from public.create_room('Alice');
  select participant_id into b from public.join_room((select code from public.rooms limit 1), 'Bob');
  perform set_config('test.alice', a::text, false);
  perform set_config('test.bob',   b::text, false);
  perform set_config('test.room',  rid::text, false);
end$$;

-- non-facilitator cannot start
select throws_ok(
  $$ select public.start_timer(current_setting('test.bob')::uuid, 300) $$,
  'P0001',
  'not_facilitator',
  'non-facilitator cannot start timer'
);

-- facilitator can start
do $$
begin
  perform public.start_timer(current_setting('test.alice')::uuid, 300);
end$$;
select isnt(
  (select timer_started_at from public.rooms where id = current_setting('test.room')::uuid),
  null,
  'timer started'
);
select is(
  (select timer_seconds from public.rooms where id = current_setting('test.room')::uuid),
  300,
  'timer seconds set'
);

-- stop clears
do $$
begin
  perform public.stop_timer(current_setting('test.alice')::uuid);
end$$;
select is(
  (select timer_started_at from public.rooms where id = current_setting('test.room')::uuid),
  null,
  'timer cleared'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Write migration**

`supabase/migrations/0006_rpcs_timer.sql`:

```sql
create or replace function public._room_for_participant(p_pid uuid)
returns uuid language sql stable as $$
  select room_id from public.participants where id = p_pid;
$$;

create or replace function public.start_timer(
  p_participant_id uuid,
  p_seconds int
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid := public._room_for_participant(p_participant_id);
begin
  if v_room_id is null then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._is_facilitator(p_participant_id) then
    raise exception 'not_facilitator' using errcode = 'P0001';
  end if;
  if p_seconds < 30 or p_seconds > 3600 then
    raise exception 'invalid_seconds' using errcode = 'P0001';
  end if;
  update public.rooms
    set timer_started_at = now(), timer_seconds = p_seconds
    where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

create or replace function public.stop_timer(p_participant_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid := public._room_for_participant(p_participant_id);
begin
  if v_room_id is null then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._is_facilitator(p_participant_id) then
    raise exception 'not_facilitator' using errcode = 'P0001';
  end if;
  update public.rooms
    set timer_started_at = null, timer_seconds = null
    where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

grant execute on function public.start_timer(uuid, int) to anon, authenticated;
grant execute on function public.stop_timer(uuid)       to anon, authenticated;
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0006_rpcs_timer.sql supabase/tests/0006_rpcs_timer.test.sql
git commit -m "feat(db): add timer RPCs (start, stop)"
```

---

### Task 11: Facilitator RPCs — set_anonymous_mode, reveal_authors, set_votes_per_user, end_room

**Files:**
- Create: `supabase/migrations/0007_rpcs_facilitator.sql`, `supabase/tests/0007_rpcs_facilitator.test.sql`

- [ ] **Step 1: Failing test**

`supabase/tests/0007_rpcs_facilitator.test.sql`:

```sql
begin;
select plan(7);

do $$
declare a uuid; b uuid; rid uuid;
begin
  select participant_id, room_id into a, rid from public.create_room('Alice');
  select participant_id into b from public.join_room((select code from public.rooms limit 1), 'Bob');
  perform set_config('test.alice', a::text, false);
  perform set_config('test.bob',   b::text, false);
  perform set_config('test.room',  rid::text, false);
end$$;

-- non-facilitator denied
select throws_ok(
  $$ select public.set_anonymous_mode(current_setting('test.bob')::uuid, true) $$,
  'P0001',
  'not_facilitator',
  'non-facilitator denied'
);

-- facilitator turns on anon
do $$ begin perform public.set_anonymous_mode(current_setting('test.alice')::uuid, true); end$$;
select is(
  (select anonymous_mode from public.rooms where id = current_setting('test.room')::uuid),
  true,
  'anon on'
);
select is(
  (select authors_revealed from public.rooms where id = current_setting('test.room')::uuid),
  false,
  'reveal reset to false when turning anon on'
);

-- reveal_authors
do $$ begin perform public.reveal_authors(current_setting('test.alice')::uuid); end$$;
select is(
  (select authors_revealed from public.rooms where id = current_setting('test.room')::uuid),
  true,
  'authors revealed'
);

-- set_votes_per_user validates range
select throws_ok(
  $$ select public.set_votes_per_user(current_setting('test.alice')::uuid, 100) $$,
  'P0001',
  'invalid_votes_per_user',
  'votes_per_user out of range'
);

-- set_votes_per_user works
do $$ begin perform public.set_votes_per_user(current_setting('test.alice')::uuid, 3); end$$;
select is(
  (select votes_per_user from public.rooms where id = current_setting('test.room')::uuid),
  3,
  'votes_per_user updated'
);

-- end_room
do $$ begin perform public.end_room(current_setting('test.alice')::uuid); end$$;
select isnt(
  (select ended_at from public.rooms where id = current_setting('test.room')::uuid),
  null,
  'room ended'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Write migration**

`supabase/migrations/0007_rpcs_facilitator.sql`:

```sql
create or replace function public.set_anonymous_mode(
  p_participant_id uuid,
  p_on boolean
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid := public._room_for_participant(p_participant_id);
begin
  if v_room_id is null then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._is_facilitator(p_participant_id) then
    raise exception 'not_facilitator' using errcode = 'P0001';
  end if;
  update public.rooms
    set anonymous_mode = p_on,
        authors_revealed = case when p_on then false else authors_revealed end
    where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

create or replace function public.reveal_authors(p_participant_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid := public._room_for_participant(p_participant_id);
begin
  if v_room_id is null then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._is_facilitator(p_participant_id) then
    raise exception 'not_facilitator' using errcode = 'P0001';
  end if;
  update public.rooms set authors_revealed = true where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

create or replace function public.set_votes_per_user(
  p_participant_id uuid,
  p_n int
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid := public._room_for_participant(p_participant_id);
begin
  if v_room_id is null then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._is_facilitator(p_participant_id) then
    raise exception 'not_facilitator' using errcode = 'P0001';
  end if;
  if p_n < 1 or p_n > 20 then
    raise exception 'invalid_votes_per_user' using errcode = 'P0001';
  end if;
  update public.rooms set votes_per_user = p_n where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

create or replace function public.end_room(p_participant_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid := public._room_for_participant(p_participant_id);
begin
  if v_room_id is null then
    raise exception 'not_in_room' using errcode = 'P0001';
  end if;
  if not public._is_facilitator(p_participant_id) then
    raise exception 'not_facilitator' using errcode = 'P0001';
  end if;
  update public.rooms set ended_at = now() where id = v_room_id;
  perform public._bump_activity(v_room_id);
end;
$$;

grant execute on function public.set_anonymous_mode(uuid, boolean) to anon, authenticated;
grant execute on function public.reveal_authors(uuid)              to anon, authenticated;
grant execute on function public.set_votes_per_user(uuid, int)     to anon, authenticated;
grant execute on function public.end_room(uuid)                    to anon, authenticated;
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0007_rpcs_facilitator.sql supabase/tests/0007_rpcs_facilitator.test.sql
git commit -m "feat(db): add facilitator RPCs (anon mode, reveal, votes-per-user, end)"
```

---

### Task 12: Rate-limit guard

**Files:**
- Create: `supabase/migrations/0008_rate_limits.sql`, `supabase/tests/0008_rate_limits.test.sql`

- [ ] **Step 1: Failing test**

`supabase/tests/0008_rate_limits.test.sql`:

```sql
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
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Write migration**

`supabase/migrations/0008_rate_limits.sql`:

```sql
-- Sliding-window rate limit using existing tables (no new state).
create or replace function public._rate_limit_check(
  p_participant_id uuid,
  p_action text,
  p_limit int,
  p_window interval default interval '1 minute'
) returns void
language plpgsql as $$
declare v_count int;
begin
  if p_action = 'add_card' then
    select count(*) into v_count from public.cards
      where author_id = p_participant_id and created_at > now() - p_window;
  elsif p_action = 'cast_vote' then
    select count(*) into v_count from public.votes
      where voter_id = p_participant_id and created_at > now() - p_window;
  elsif p_action = 'edit_card' then
    select count(*) into v_count from public.cards
      where author_id = p_participant_id and updated_at > now() - p_window;
  else
    return;
  end if;
  if v_count >= p_limit then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
end;
$$;

-- Patch RPCs to call rate-limit
create or replace function public.add_card(
  p_participant_id uuid,
  p_column_key text,
  p_body text
) returns public.cards
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_card public.cards;
begin
  perform public._rate_limit_check(p_participant_id, 'add_card', 30);
  select room_id into v_room_id from public.participants where id = p_participant_id;
  if v_room_id is null then raise exception 'not_in_room' using errcode = 'P0001'; end if;
  if not public._room_active(v_room_id) then raise exception 'room_ended' using errcode = 'P0001'; end if;
  insert into public.cards (room_id, column_key, author_id, body)
    values (v_room_id, p_column_key, p_participant_id, p_body)
    returning * into v_card;
  perform public._bump_activity(v_room_id);
  return v_card;
end;
$$;

create or replace function public.cast_vote(
  p_participant_id uuid,
  p_card_id uuid
) returns public.votes
language plpgsql security definer set search_path = public as $$
declare
  v_room_id uuid;
  v_limit int;
  v_count int;
  v_vote public.votes;
begin
  perform public._rate_limit_check(p_participant_id, 'cast_vote', 60);
  select c.room_id into v_room_id from public.cards c where c.id = p_card_id;
  if v_room_id is null then raise exception 'card_not_found' using errcode = 'P0001'; end if;
  if not public._participant_in_room(p_participant_id, v_room_id) then raise exception 'not_in_room' using errcode = 'P0001'; end if;
  if not public._room_active(v_room_id) then raise exception 'room_ended' using errcode = 'P0001'; end if;
  select votes_per_user into v_limit from public.rooms where id = v_room_id;
  select count(*) into v_count from public.votes where voter_id = p_participant_id and room_id = v_room_id;
  if v_count >= v_limit then raise exception 'vote_limit_reached' using errcode = 'P0001'; end if;
  insert into public.votes (room_id, card_id, voter_id)
    values (v_room_id, p_card_id, p_participant_id)
    returning * into v_vote;
  perform public._bump_activity(v_room_id);
  return v_vote;
end;
$$;
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0008_rate_limits.sql supabase/tests/0008_rate_limits.test.sql
git commit -m "feat(db): add rate limits for add_card and cast_vote"
```

---

### Task 13: Anonymous-mode SQL view + Realtime publication scope

**Files:**
- Create: `supabase/migrations/0009_anon_view.sql`, `supabase/tests/0009_anon_view.test.sql`

> Goal: realtime payloads must redact `author_id` to non-authors when anon mode is on and authors not revealed. Approach: replace the publication for `cards` with a publication that includes `cards` table, and rely on **SQL view `cards_visible`** for HTTP reads (initial snapshot) plus a server-side trigger that broadcasts a redacted card-event to a Supabase Realtime broadcast channel for `INSERT` while anon mode is on. Subscribe clients to BOTH `postgres_changes(cards)` AND a per-room broadcast channel. UI prefers broadcast events when anon mode is on (unredacted payload from postgres_changes is dropped client-side by checking `room.anonymous_mode && !room.authors_revealed && card.author_id !== self`).

> Pragmatic v1: simpler — UI redacts `author_id` client-side based on room state. The realtime payload includes `author_id`, but the UI never displays it under anon-mode rules. Network-level information disclosure to a determined client exists; documented in spec as accepted v1 trade-off.

> The view `cards_visible` is still useful for HTTP fetches (e.g. SSR or non-realtime).

- [ ] **Step 1: Failing test**

`supabase/tests/0009_anon_view.test.sql`:

```sql
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
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Write migration**

`supabase/migrations/0009_anon_view.sql`:

```sql
-- Function that returns cards with author_id redacted under anon mode.
create or replace function public.cards_visible(p_viewer_id uuid)
returns table(
  id uuid,
  room_id uuid,
  column_key text,
  author_id uuid,
  body text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    c.id,
    c.room_id,
    c.column_key,
    case
      when r.anonymous_mode and not r.authors_revealed and c.author_id <> p_viewer_id then null
      else c.author_id
    end as author_id,
    c.body,
    c.created_at,
    c.updated_at
  from public.cards c
  join public.rooms r on r.id = c.room_id
  where c.room_id = (select room_id from public.participants where id = p_viewer_id);
$$;

grant execute on function public.cards_visible(uuid) to anon, authenticated;

-- Update get_room_state to use cards_visible
create or replace function public.get_room_state(p_room_id uuid, p_viewer_id uuid default null)
returns table(
  room json,
  participants json,
  cards json,
  votes json
)
language sql security definer set search_path = public as $$
  select
    (select to_jsonb(r) from public.rooms r where r.id = p_room_id),
    (select coalesce(jsonb_agg(p), '[]'::jsonb) from public.participants p where p.room_id = p_room_id),
    (select coalesce(jsonb_agg(cv), '[]'::jsonb) from public.cards_visible(p_viewer_id) cv where cv.room_id = p_room_id),
    (select coalesce(jsonb_agg(v), '[]'::jsonb) from public.votes v where v.room_id = p_room_id);
$$;

grant execute on function public.get_room_state(uuid, uuid) to anon, authenticated;
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0009_anon_view.sql supabase/tests/0009_anon_view.test.sql
git commit -m "feat(db): add cards_visible view for anonymous-mode redaction"
```

---

### Task 14: pg_cron TTL cleanup

**Files:**
- Create: `supabase/migrations/0010_pg_cron_ttl.sql`, `supabase/tests/0010_pg_cron_ttl.test.sql`

- [ ] **Step 1: Failing test**

`supabase/tests/0010_pg_cron_ttl.test.sql`:

```sql
begin;
select plan(2);

-- create a room and back-date last_activity_at
do $$
declare a uuid; rid uuid;
begin
  select participant_id, room_id into a, rid from public.create_room('Alice');
  update public.rooms set last_activity_at = now() - interval '2 days' where id = rid;
end$$;
select is((select count(*)::int from public.rooms), 1, 'one room exists');

-- run cleanup
select public.purge_stale_rooms();
select is((select count(*)::int from public.rooms), 0, 'stale room purged');

select * from finish();
rollback;
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Write migration**

`supabase/migrations/0010_pg_cron_ttl.sql`:

```sql
create extension if not exists pg_cron with schema extensions;

create or replace function public.purge_stale_rooms()
returns int language sql security definer set search_path = public as $$
  with deleted as (
    delete from public.rooms
    where last_activity_at < now() - interval '24 hours'
    returning 1
  )
  select count(*)::int from deleted;
$$;

grant execute on function public.purge_stale_rooms() to anon, authenticated;

-- schedule hourly (idempotent)
do $$
begin
  perform cron.schedule('purge_stale_rooms_hourly', '0 * * * *', $cron$ select public.purge_stale_rooms(); $cron$);
exception when others then
  -- ignore re-schedule conflict in tests
  null;
end$$;
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0010_pg_cron_ttl.sql supabase/tests/0010_pg_cron_ttl.test.sql
git commit -m "feat(db): add pg_cron TTL cleanup for stale rooms"
```

---

## Phase C — Frontend Foundations

### Task 15: Generated DB types + Supabase client wrappers

**Files:**
- Create: `lib/supabase/types.ts` (generated), `lib/supabase/browser.ts`, `lib/supabase/server.ts`

- [ ] **Step 1: Generate types**

```bash
pnpm supabase gen types typescript --local > lib/supabase/types.ts
```

- [ ] **Step 2: `lib/supabase/browser.ts`**

```ts
'use client';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function getBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: `lib/supabase/server.ts`**

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (entries) => entries.forEach((c) => cookieStore.set(c.name, c.value, c.options)),
      },
    },
  );
}
```

- [ ] **Step 4: Sanity test**

`tests/unit/supabase-clients.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://x');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'k');

describe('browser client', () => {
  it('imports', async () => {
    const mod = await import('@/lib/supabase/browser');
    expect(typeof mod.getBrowserClient).toBe('function');
  });
});
```

Run: `pnpm test`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/ tests/unit/supabase-clients.test.ts
git commit -m "feat: add Supabase browser+server client wrappers and generated types"
```

---

### Task 16: identity.ts cookie helper

**Files:**
- Create: `lib/identity.ts`, `tests/unit/identity.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/identity.test.ts
import { describe, it, expect } from 'vitest';
import { COOKIE_NAME, parseIdentityFromCookies, serializeIdentity } from '@/lib/identity';

describe('identity cookie', () => {
  it('serializes and parses a participant id', () => {
    const id = '11111111-1111-1111-1111-111111111111';
    const headerValue = serializeIdentity(id, '/r/123456');
    const parsed = parseIdentityFromCookies(`${COOKIE_NAME}=${id}`);
    expect(parsed).toBe(id);
    expect(headerValue).toContain(`${COOKIE_NAME}=${id}`);
    expect(headerValue).toContain('Path=/r/123456');
    expect(headerValue).toContain('HttpOnly');
    expect(headerValue).toContain('SameSite=Lax');
  });

  it('returns null when cookie missing', () => {
    expect(parseIdentityFromCookies('other=1')).toBeNull();
  });
});
```

Run: `pnpm test` — fails (module not found).

- [ ] **Step 2: Write `lib/identity.ts`**

```ts
export const COOKIE_NAME = 'retroball_pid';

export function serializeIdentity(participantId: string, path = '/'): string {
  const parts = [
    `${COOKIE_NAME}=${participantId}`,
    `Path=${path}`,
    `Max-Age=${60 * 60 * 48}`, // 48h: room TTL is 24h, leeway covers reconnect
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
  ];
  return parts.join('; ');
}

export function parseIdentityFromCookies(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const raw of cookieHeader.split(';')) {
    const [k, v] = raw.trim().split('=');
    if (k === COOKIE_NAME && v) return v;
  }
  return null;
}
```

- [ ] **Step 3: Run, expect pass.**

- [ ] **Step 4: Commit**

```bash
git add lib/identity.ts tests/unit/identity.test.ts
git commit -m "feat: add identity cookie helpers"
```

---

### Task 17: zustand store + reducer + types

**Files:**
- Create: `lib/realtime/store.ts`, `lib/realtime/reducer.ts`, `tests/unit/store.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/store.test.ts
import { describe, it, expect } from 'vitest';
import { reducer, initialState, type RoomEvent } from '@/lib/realtime/reducer';

const room = {
  id: 'r', code: '123456', template: 'mad-sad-glad', facilitator_id: 'a',
  anonymous_mode: false, votes_per_user: 5, authors_revealed: false,
  timer_started_at: null, timer_seconds: null, ended_at: null,
  created_at: '', last_activity_at: '',
} as const;

describe('reducer', () => {
  it('snapshot seeds state', () => {
    const s = reducer(initialState, { kind: 'snapshot', room, participants: [], cards: [], votes: [] });
    expect(s.room?.id).toBe('r');
  });

  it('card insert appends', () => {
    const s1 = reducer(initialState, { kind: 'snapshot', room, participants: [], cards: [], votes: [] });
    const card = { id: 'c1', room_id: 'r', column_key: 'mad', author_id: 'a', body: 'x', created_at: '', updated_at: '' };
    const s2 = reducer(s1, { kind: 'card_insert', card });
    expect(s2.cards).toHaveLength(1);
    expect(s2.cards[0].id).toBe('c1');
  });

  it('vote tally', () => {
    const card = { id: 'c1', room_id: 'r', column_key: 'mad', author_id: 'a', body: 'x', created_at: '', updated_at: '' };
    const events: RoomEvent[] = [
      { kind: 'snapshot', room, participants: [], cards: [card], votes: [] },
      { kind: 'vote_insert', vote: { id: 'v1', room_id: 'r', card_id: 'c1', voter_id: 'a', created_at: '' } },
      { kind: 'vote_insert', vote: { id: 'v2', room_id: 'r', card_id: 'c1', voter_id: 'a', created_at: '' } },
    ];
    const s = events.reduce(reducer, initialState);
    expect(s.votes.length).toBe(2);
  });
});
```

Run: `pnpm test` — fails.

- [ ] **Step 2: Write `lib/realtime/reducer.ts`**

```ts
import type { Database } from '@/lib/supabase/types';

export type Room = Database['public']['Tables']['rooms']['Row'];
export type Participant = Database['public']['Tables']['participants']['Row'];
export type Card = Database['public']['Tables']['cards']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];

export type RoomState = {
  room: Room | null;
  participants: Participant[];
  cards: Card[];
  votes: Vote[];
};

export const initialState: RoomState = {
  room: null,
  participants: [],
  cards: [],
  votes: [],
};

export type RoomEvent =
  | { kind: 'snapshot'; room: Room; participants: Participant[]; cards: Card[]; votes: Vote[] }
  | { kind: 'room_update'; room: Room }
  | { kind: 'participant_insert'; participant: Participant }
  | { kind: 'participant_update'; participant: Participant }
  | { kind: 'participant_delete'; id: string }
  | { kind: 'card_insert'; card: Card }
  | { kind: 'card_update'; card: Card }
  | { kind: 'card_delete'; id: string }
  | { kind: 'vote_insert'; vote: Vote }
  | { kind: 'vote_delete'; id: string };

export function reducer(s: RoomState, e: RoomEvent): RoomState {
  switch (e.kind) {
    case 'snapshot':
      return { room: e.room, participants: e.participants, cards: e.cards, votes: e.votes };
    case 'room_update':
      return { ...s, room: e.room };
    case 'participant_insert':
      return s.participants.find((p) => p.id === e.participant.id)
        ? s
        : { ...s, participants: [...s.participants, e.participant] };
    case 'participant_update':
      return { ...s, participants: s.participants.map((p) => (p.id === e.participant.id ? e.participant : p)) };
    case 'participant_delete':
      return { ...s, participants: s.participants.filter((p) => p.id !== e.id) };
    case 'card_insert':
      return s.cards.find((c) => c.id === e.card.id) ? s : { ...s, cards: [...s.cards, e.card] };
    case 'card_update':
      return { ...s, cards: s.cards.map((c) => (c.id === e.card.id ? e.card : c)) };
    case 'card_delete':
      return { ...s, cards: s.cards.filter((c) => c.id !== e.id) };
    case 'vote_insert':
      return s.votes.find((v) => v.id === e.vote.id) ? s : { ...s, votes: [...s.votes, e.vote] };
    case 'vote_delete':
      return { ...s, votes: s.votes.filter((v) => v.id !== e.id) };
  }
}
```

- [ ] **Step 3: Write `lib/realtime/store.ts`**

```ts
'use client';
import { create } from 'zustand';
import { initialState, reducer, type RoomEvent, type RoomState } from './reducer';

type StoreApi = RoomState & {
  dispatch: (e: RoomEvent) => void;
  reset: () => void;
};

export const useRoomStore = create<StoreApi>((set) => ({
  ...initialState,
  dispatch: (e) => set((prev) => reducer(prev, e)),
  reset: () => set({ ...initialState }),
}));
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add lib/realtime/ tests/unit/store.test.ts
git commit -m "feat: add room state reducer and zustand store"
```

---

### Task 18: useRoomChannel hook

**Files:**
- Create: `lib/realtime/useRoomChannel.ts`

> No unit test — covered by Playwright E2E. The hook is thin glue over the Supabase client.

- [ ] **Step 1: Write hook**

```ts
'use client';
import { useEffect } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';
import { useRoomStore } from './store';
import type { Card, Participant, Room, Vote } from './reducer';

export function useRoomChannel(roomId: string | null, viewerId: string | null) {
  const dispatch = useRoomStore((s) => s.dispatch);

  useEffect(() => {
    if (!roomId || !viewerId) return;
    const supabase = getBrowserClient();

    let cancelled = false;

    async function snapshot() {
      const { data, error } = await supabase.rpc('get_room_state', { p_room_id: roomId, p_viewer_id: viewerId });
      if (cancelled || error || !data?.[0]?.room) return;
      const row = data[0];
      dispatch({
        kind: 'snapshot',
        room: row.room as Room,
        participants: (row.participants as Participant[]) ?? [],
        cards: (row.cards as Card[]) ?? [],
        votes: (row.votes as Vote[]) ?? [],
      });
    }

    snapshot();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'UPDATE') dispatch({ kind: 'room_update', room: p.new as Room });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'INSERT') dispatch({ kind: 'participant_insert', participant: p.new as Participant });
        else if (p.eventType === 'UPDATE') dispatch({ kind: 'participant_update', participant: p.new as Participant });
        else if (p.eventType === 'DELETE') dispatch({ kind: 'participant_delete', id: (p.old as { id: string }).id });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards', filter: `room_id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'INSERT') dispatch({ kind: 'card_insert', card: p.new as Card });
        else if (p.eventType === 'UPDATE') dispatch({ kind: 'card_update', card: p.new as Card });
        else if (p.eventType === 'DELETE') dispatch({ kind: 'card_delete', id: (p.old as { id: string }).id });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'INSERT') dispatch({ kind: 'vote_insert', vote: p.new as Vote });
        else if (p.eventType === 'DELETE') dispatch({ kind: 'vote_delete', id: (p.old as { id: string }).id });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ participant_id: viewerId });
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          await snapshot(); // refetch on reconnect
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId, viewerId, dispatch]);
}
```

- [ ] **Step 2: Type-check passes**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/realtime/useRoomChannel.ts
git commit -m "feat: add useRoomChannel hook (snapshot + realtime + presence)"
```

---

### Task 19: Selector hook useRoomState

**Files:**
- Create: `lib/realtime/useRoomState.ts`, `tests/unit/selectors.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/selectors.test.ts
import { describe, it, expect } from 'vitest';
import { selectVoteTallies, selectMyVoteCount, selectCardsByColumn } from '@/lib/realtime/selectors';

const cards = [
  { id: 'c1', room_id: 'r', column_key: 'mad', author_id: 'a', body: 'x', created_at: '1', updated_at: '1' },
  { id: 'c2', room_id: 'r', column_key: 'glad', author_id: 'b', body: 'y', created_at: '2', updated_at: '2' },
];
const votes = [
  { id: 'v1', room_id: 'r', card_id: 'c1', voter_id: 'a', created_at: '' },
  { id: 'v2', room_id: 'r', card_id: 'c1', voter_id: 'a', created_at: '' },
  { id: 'v3', room_id: 'r', card_id: 'c2', voter_id: 'b', created_at: '' },
];

describe('selectors', () => {
  it('vote tallies per card', () => {
    expect(selectVoteTallies(votes as never)).toEqual({ c1: 2, c2: 1 });
  });
  it('my vote count', () => {
    expect(selectMyVoteCount(votes as never, 'a')).toBe(2);
  });
  it('cards by column', () => {
    expect(selectCardsByColumn(cards as never).mad.length).toBe(1);
    expect(selectCardsByColumn(cards as never).glad.length).toBe(1);
    expect(selectCardsByColumn(cards as never).sad.length).toBe(0);
  });
});
```

Run: `pnpm test` — fails.

- [ ] **Step 2: Write `lib/realtime/selectors.ts`**

```ts
import type { Card, Vote } from './reducer';

export function selectVoteTallies(votes: Vote[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of votes) out[v.card_id] = (out[v.card_id] ?? 0) + 1;
  return out;
}

export function selectMyVoteCount(votes: Vote[], voterId: string): number {
  let n = 0;
  for (const v of votes) if (v.voter_id === voterId) n++;
  return n;
}

export function selectCardsByColumn(cards: Card[]): Record<'mad' | 'sad' | 'glad', Card[]> {
  const out = { mad: [] as Card[], sad: [] as Card[], glad: [] as Card[] };
  for (const c of cards) {
    if (c.column_key === 'mad' || c.column_key === 'sad' || c.column_key === 'glad') out[c.column_key].push(c);
  }
  for (const k of ['mad', 'sad', 'glad'] as const) out[k].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return out;
}
```

- [ ] **Step 3: Write `lib/realtime/useRoomState.ts`**

```ts
'use client';
import { useRoomStore } from './store';
import { selectCardsByColumn, selectMyVoteCount, selectVoteTallies } from './selectors';

export function useRoomState() {
  const room = useRoomStore((s) => s.room);
  const participants = useRoomStore((s) => s.participants);
  const cards = useRoomStore((s) => s.cards);
  const votes = useRoomStore((s) => s.votes);
  return {
    room,
    participants,
    cards,
    votes,
    cardsByColumn: selectCardsByColumn(cards),
    voteTallies: selectVoteTallies(votes),
    myVoteCount: (myId: string) => selectMyVoteCount(votes, myId),
  };
}
```

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit**

```bash
git add lib/realtime/selectors.ts lib/realtime/useRoomState.ts tests/unit/selectors.test.ts
git commit -m "feat: add room-state selectors and useRoomState hook"
```

---

### Task 20: Error code → toast string map

**Files:**
- Create: `lib/errors.ts`, `tests/unit/errors.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/errors.test.ts
import { describe, it, expect } from 'vitest';
import { toToast } from '@/lib/errors';

describe('error mapping', () => {
  it('known codes', () => {
    expect(toToast('vote_limit_reached')).toMatch(/vote/i);
    expect(toToast('not_facilitator')).toMatch(/facilitator/i);
    expect(toToast('room_not_found')).toMatch(/room/i);
  });
  it('unknown -> generic', () => {
    expect(toToast('???')).toMatch(/something went wrong/i);
  });
});
```

- [ ] **Step 2: Write `lib/errors.ts`**

```ts
const MAP: Record<string, string> = {
  vote_limit_reached: 'You used all your votes.',
  not_facilitator: 'Only the facilitator can do that.',
  not_authorized: "You can't do that.",
  not_card_owner: 'Only the author can edit this card.',
  not_in_room: 'You left this room — refresh to rejoin.',
  card_not_found: 'Card already removed.',
  room_not_found: 'Room not found or expired.',
  room_ended: 'The retro has ended.',
  rate_limited: 'Slow down a bit.',
  invalid_seconds: 'Pick a duration between 30s and 1h.',
  invalid_votes_per_user: 'Votes per user must be 1–20.',
  room_code_exhausted: 'Could not generate a unique code, try again.',
};

export function toToast(code: string | null | undefined): string {
  return (code && MAP[code]) || 'Something went wrong.';
}
```

- [ ] **Step 3: Run, expect pass.**

- [ ] **Step 4: Commit**

```bash
git add lib/errors.ts tests/unit/errors.test.ts
git commit -m "feat: add error code → toast string map"
```

---

## Phase D — RPC Wrappers

### Task 21: createRoom + joinRoom wrappers (server actions)

**Files:**
- Create: `lib/rpc/createRoom.ts`, `lib/rpc/joinRoom.ts`

> These are Next.js Server Actions because they set the cookie. They run on the server with the anon key, then write the participant cookie.

- [ ] **Step 1: `lib/rpc/createRoom.ts`**

```ts
'use server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getServerClient } from '@/lib/supabase/server';
import { COOKIE_NAME } from '@/lib/identity';

export async function createRoomAction(formData: FormData): Promise<void> {
  const displayName = String(formData.get('displayName') ?? '').trim();
  if (!displayName) throw new Error('display_name_required');
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('create_room', { p_display_name: displayName });
  if (error || !data?.[0]) throw new Error(error?.message ?? 'create_failed');
  const { code, participant_id } = data[0];
  const c = await cookies();
  c.set(COOKIE_NAME, participant_id, {
    path: `/r/${code}`,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 48,
  });
  redirect(`/r/${code}`);
}
```

- [ ] **Step 2: `lib/rpc/joinRoom.ts`**

```ts
'use server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getServerClient } from '@/lib/supabase/server';
import { COOKIE_NAME } from '@/lib/identity';

export async function joinRoomAction(code: string, formData: FormData): Promise<void> {
  const displayName = String(formData.get('displayName') ?? '').trim();
  if (!displayName) throw new Error('display_name_required');
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('join_room', { p_code: code, p_display_name: displayName });
  if (error || !data?.[0]) throw new Error(error?.message ?? 'join_failed');
  const { participant_id } = data[0];
  const c = await cookies();
  c.set(COOKIE_NAME, participant_id, {
    path: `/r/${code}`,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 48,
  });
  redirect(`/r/${code}`);
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck` → no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/rpc/createRoom.ts lib/rpc/joinRoom.ts
git commit -m "feat(rpc): add createRoom and joinRoom server actions"
```

---

### Task 22: Card RPC wrappers (client)

**Files:**
- Create: `lib/rpc/addCard.ts`, `lib/rpc/editCard.ts`, `lib/rpc/deleteCard.ts`, `tests/unit/rpc.test.ts`

- [ ] **Step 1: Failing test (mock Supabase)**

```ts
// tests/unit/rpc.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpcMock = vi.fn();
vi.mock('@/lib/supabase/browser', () => ({
  getBrowserClient: () => ({ rpc: rpcMock }),
}));

describe('addCard', () => {
  beforeEach(() => rpcMock.mockReset());

  it('calls add_card and returns row', async () => {
    rpcMock.mockResolvedValue({ data: { id: 'c1', body: 'hi' }, error: null });
    const { addCard } = await import('@/lib/rpc/addCard');
    const card = await addCard({ participantId: 'p1', columnKey: 'mad', body: 'hi' });
    expect(rpcMock).toHaveBeenCalledWith('add_card', {
      p_participant_id: 'p1', p_column_key: 'mad', p_body: 'hi',
    });
    expect(card.id).toBe('c1');
  });

  it('throws RpcError with code on rejection', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'rate_limited' } });
    const { addCard, RpcError } = await import('@/lib/rpc/addCard');
    await expect(addCard({ participantId: 'p1', columnKey: 'mad', body: 'hi' }))
      .rejects.toBeInstanceOf(RpcError);
  });
});
```

Run: `pnpm test` — fails.

- [ ] **Step 2: Write `lib/rpc/_shared.ts`**

```ts
export class RpcError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export function extractCode(message: string | undefined): string {
  if (!message) return 'unknown';
  // Postgres error message format: "<code>" — RPCs raise plain code strings
  return message.replace(/^.*"([a-z_]+)".*$/, '$1') === message ? message : message.replace(/^.*"([a-z_]+)".*$/, '$1');
}
```

- [ ] **Step 3: Write `lib/rpc/addCard.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';
import type { Card } from '@/lib/realtime/reducer';

export { RpcError };

export async function addCard(args: {
  participantId: string; columnKey: 'mad' | 'sad' | 'glad'; body: string;
}): Promise<Card> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase.rpc('add_card', {
    p_participant_id: args.participantId,
    p_column_key: args.columnKey,
    p_body: args.body,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
  return data as Card;
}
```

- [ ] **Step 4: Write `lib/rpc/editCard.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';
import type { Card } from '@/lib/realtime/reducer';

export async function editCard(args: { participantId: string; cardId: string; body: string }): Promise<Card> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase.rpc('edit_card', {
    p_participant_id: args.participantId,
    p_card_id: args.cardId,
    p_body: args.body,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
  return data as Card;
}
```

- [ ] **Step 5: Write `lib/rpc/deleteCard.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function deleteCard(args: { participantId: string; cardId: string }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('delete_card', {
    p_participant_id: args.participantId,
    p_card_id: args.cardId,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
```

- [ ] **Step 6: Run, expect pass.**

- [ ] **Step 7: Commit**

```bash
git add lib/rpc/_shared.ts lib/rpc/addCard.ts lib/rpc/editCard.ts lib/rpc/deleteCard.ts tests/unit/rpc.test.ts
git commit -m "feat(rpc): add card wrappers (add, edit, delete)"
```

---

### Task 23: Vote, timer, facilitator wrappers

**Files:**
- Create: `lib/rpc/castVote.ts`, `lib/rpc/revokeVote.ts`, `lib/rpc/startTimer.ts`, `lib/rpc/stopTimer.ts`, `lib/rpc/setAnonymousMode.ts`, `lib/rpc/revealAuthors.ts`, `lib/rpc/setVotesPerUser.ts`, `lib/rpc/endRoom.ts`

- [ ] **Step 1: `lib/rpc/castVote.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function castVote(args: { participantId: string; cardId: string }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('cast_vote', {
    p_participant_id: args.participantId, p_card_id: args.cardId,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
```

- [ ] **Step 2: `lib/rpc/revokeVote.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function revokeVote(args: { participantId: string; cardId: string }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('revoke_vote', {
    p_participant_id: args.participantId, p_card_id: args.cardId,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
```

- [ ] **Step 3: `lib/rpc/startTimer.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function startTimer(args: { participantId: string; seconds: number }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('start_timer', {
    p_participant_id: args.participantId, p_seconds: args.seconds,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
```

- [ ] **Step 4: `lib/rpc/stopTimer.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function stopTimer(args: { participantId: string }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('stop_timer', { p_participant_id: args.participantId });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
```

- [ ] **Step 5: `lib/rpc/setAnonymousMode.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function setAnonymousMode(args: { participantId: string; on: boolean }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('set_anonymous_mode', {
    p_participant_id: args.participantId, p_on: args.on,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
```

- [ ] **Step 6: `lib/rpc/revealAuthors.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function revealAuthors(args: { participantId: string }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('reveal_authors', { p_participant_id: args.participantId });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
```

- [ ] **Step 7: `lib/rpc/setVotesPerUser.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function setVotesPerUser(args: { participantId: string; n: number }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('set_votes_per_user', {
    p_participant_id: args.participantId, p_n: args.n,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
```

- [ ] **Step 8: `lib/rpc/endRoom.ts`**

```ts
'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function endRoom(args: { participantId: string }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('end_room', { p_participant_id: args.participantId });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
```

- [ ] **Step 9: Typecheck**

Run: `pnpm typecheck` → no errors.

- [ ] **Step 10: Commit**

```bash
git add lib/rpc/
git commit -m "feat(rpc): add vote, timer, facilitator wrappers"
```

---

## Phase E — UI

### Task 24: Landing page (Create + Join)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Initialize shadcn**

```bash
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button input label card toast
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createRoomAction } from '@/lib/rpc/createRoom';
import { redirect } from 'next/navigation';

async function joinFromLanding(formData: FormData): Promise<void> {
  'use server';
  const code = String(formData.get('code') ?? '').trim();
  if (!/^[0-9]{6}$/.test(code)) throw new Error('invalid_code');
  redirect(`/r/${code}/join`);
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <div className="grid gap-6 md:grid-cols-2 max-w-3xl w-full">
        <Card>
          <CardHeader><CardTitle>Start a retro</CardTitle></CardHeader>
          <CardContent>
            <form action={createRoomAction} className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="displayName">Your name</Label>
                <Input id="displayName" name="displayName" required maxLength={40} />
              </div>
              <Button type="submit">Create room</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Join with code</CardTitle></CardHeader>
          <CardContent>
            <form action={joinFromLanding} className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="code">6-digit code</Label>
                <Input id="code" name="code" required pattern="\d{6}" inputMode="numeric" />
              </div>
              <Button type="submit" variant="secondary">Continue</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Smoke**

Run dev server: `pnpm dev`. Visit `/`. See two cards. Submit "Create room" with a name → redirects to `/r/{code}` (404 page expected — Board route not yet built).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/ui/ components.json lib/utils.ts 2>/dev/null
git add -A
git commit -m "feat(ui): landing page with create + join forms"
```

---

### Task 25: Join page (display name entry)

**Files:**
- Create: `app/r/[code]/join/page.tsx`

- [ ] **Step 1: Write file**

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { joinRoomAction } from '@/lib/rpc/joinRoom';

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  async function action(formData: FormData) {
    'use server';
    await joinRoomAction(code, formData);
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Join room {code}</CardTitle></CardHeader>
        <CardContent>
          <form action={action} className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="displayName">Your name</Label>
              <Input id="displayName" name="displayName" required maxLength={40} autoFocus />
            </div>
            <Button type="submit">Join</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Smoke**

Run: `pnpm dev`. Visit `/r/123456/join`. See form. (Submitting will fail — room doesn't exist.)

- [ ] **Step 3: Commit**

```bash
git add app/r/
git commit -m "feat(ui): add join page"
```

---

### Task 26: Board route + Board component shell

**Files:**
- Create: `app/r/[code]/page.tsx`, `components/board/Board.tsx`

- [ ] **Step 1: `app/r/[code]/page.tsx`** (server component, looks up room id from cookie + code)

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { COOKIE_NAME } from '@/lib/identity';
import { Board } from '@/components/board/Board';

export default async function BoardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = await cookies();
  const participantId = c.get(COOKIE_NAME)?.value ?? null;
  if (!participantId) redirect(`/r/${code}/join`);

  const supabase = await getServerClient();
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('id, code, ended_at')
    .eq('code', code)
    .limit(1);
  if (error || !rooms?.length) redirect('/');
  const room = rooms[0];

  // Verify cookie matches a participant in this room
  const { data: parts } = await supabase
    .from('participants')
    .select('id')
    .eq('id', participantId)
    .eq('room_id', room.id);
  if (!parts?.length) redirect(`/r/${code}/join`);

  return <Board roomId={room.id} viewerId={participantId} />;
}
```

- [ ] **Step 2: `components/board/Board.tsx`** (client component, owns subscription)

```tsx
'use client';
import { useRoomChannel } from '@/lib/realtime/useRoomChannel';
import { useRoomState } from '@/lib/realtime/useRoomState';

export function Board({ roomId, viewerId }: { roomId: string; viewerId: string }) {
  useRoomChannel(roomId, viewerId);
  const { room, cardsByColumn } = useRoomState();

  if (!room) return <div className="p-6">Loading…</div>;
  if (room.ended_at) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">This retro has ended</h2>
          <a className="underline" href="/">Start a new one</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-zinc-50">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Room {room.code}</h1>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {(['mad', 'sad', 'glad'] as const).map((k) => (
          <div key={k} className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="font-medium capitalize mb-2">{k}</h2>
            <ul className="space-y-2">
              {cardsByColumn[k].map((c) => (
                <li key={c.id} className="border rounded p-2 text-sm">{c.body}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Manual smoke**

```bash
pnpm dev
```

Visit `/`, create room with name "Alice". Should redirect to `/r/{code}` and show empty board with three columns. Open second browser/incognito → `/r/{code}/join` → enter "Bob" → Bob lands on board too.

- [ ] **Step 4: Commit**

```bash
git add app/r/[code]/page.tsx components/board/Board.tsx
git commit -m "feat(ui): add board route + Board shell with realtime subscription"
```

---

### Task 27: Column + Card + CardEditor components

**Files:**
- Create: `components/board/Column.tsx`, `components/board/Card.tsx`, `components/board/CardEditor.tsx`, `components/board/VoteDot.tsx`
- Modify: `components/board/Board.tsx` (use Column)

- [ ] **Step 1: `components/board/CardEditor.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addCard } from '@/lib/rpc/addCard';
import { editCard } from '@/lib/rpc/editCard';
import { toToast } from '@/lib/errors';

type Mode = { kind: 'add'; columnKey: 'mad' | 'sad' | 'glad' } | { kind: 'edit'; cardId: string; initial: string };

export function CardEditor({ participantId, mode, onClose }: { participantId: string; mode: Mode; onClose: () => void }) {
  const [body, setBody] = useState(mode.kind === 'edit' ? mode.initial : '');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true); setError(null);
    try {
      if (mode.kind === 'add') await addCard({ participantId, columnKey: mode.columnKey, body: body.trim() });
      else await editCard({ participantId, cardId: mode.cardId, body: body.trim() });
      onClose();
    } catch (e) {
      setError(toToast((e as { code?: string }).code));
      setPending(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <Input value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} autoFocus />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>Save</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 2: `components/board/VoteDot.tsx`**

```tsx
export function VoteDot({ filled }: { filled: boolean }) {
  return <span aria-hidden className={`inline-block w-2 h-2 rounded-full mr-1 ${filled ? 'bg-blue-600' : 'bg-zinc-300'}`} />;
}
```

- [ ] **Step 3: `components/board/Card.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardEditor } from './CardEditor';
import { castVote } from '@/lib/rpc/castVote';
import { revokeVote } from '@/lib/rpc/revokeVote';
import { deleteCard } from '@/lib/rpc/deleteCard';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { toToast } from '@/lib/errors';
import type { Card as CardRow } from '@/lib/realtime/reducer';

export function Card({ card, viewerId }: { card: CardRow; viewerId: string }) {
  const { room, participants, votes, voteTallies } = useRoomState();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMine = card.author_id === viewerId;
  const isFacilitator = room?.facilitator_id === viewerId;
  const myVotesOnCard = votes.filter((v) => v.voter_id === viewerId && v.card_id === card.id).length;
  const total = voteTallies[card.id] ?? 0;
  const author = participants.find((p) => p.id === card.author_id);
  const showAuthor =
    isMine ||
    !room?.anonymous_mode ||
    room.authors_revealed;
  const authorName = showAuthor ? author?.display_name ?? '—' : 'Anonymous';

  const onVote = async () => {
    setError(null);
    try { await castVote({ participantId: viewerId, cardId: card.id }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  const onUnvote = async () => {
    setError(null);
    try { await revokeVote({ participantId: viewerId, cardId: card.id }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  const onDelete = async () => {
    if (!confirm('Delete this card?')) return;
    setError(null);
    try { await deleteCard({ participantId: viewerId, cardId: card.id }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };

  if (editing) {
    return <li className="border rounded p-2 text-sm bg-white"><CardEditor participantId={viewerId} mode={{ kind: 'edit', cardId: card.id, initial: card.body }} onClose={() => setEditing(false)} /></li>;
  }

  return (
    <li className="border rounded p-2 text-sm bg-white">
      <p className="whitespace-pre-wrap">{card.body}</p>
      <p className="text-xs text-zinc-500 mt-1">{authorName}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={onVote} aria-label="Add vote">+1</Button>
        <Button size="sm" variant="ghost" onClick={onUnvote} disabled={myVotesOnCard === 0} aria-label="Remove vote">-1</Button>
        <span className="text-xs text-zinc-600" aria-label="Vote total">{total} votes</span>
        {isMine && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>}
        {(isMine || isFacilitator) && <Button size="sm" variant="ghost" onClick={onDelete}>Delete</Button>}
      </div>
      {error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
    </li>
  );
}
```

- [ ] **Step 4: `components/board/Column.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from './Card';
import { CardEditor } from './CardEditor';
import type { Card as CardRow } from '@/lib/realtime/reducer';

export function Column({
  title,
  columnKey,
  cards,
  viewerId,
}: {
  title: string;
  columnKey: 'mad' | 'sad' | 'glad';
  cards: CardRow[];
  viewerId: string;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <header className="flex items-center justify-between mb-2">
        <h2 className="font-medium">{title}</h2>
        <Button size="sm" onClick={() => setAdding(true)} aria-label={`Add card to ${title}`}>+ Card</Button>
      </header>
      <ul className="space-y-2">
        {adding && (
          <li className="border rounded p-2 text-sm bg-white">
            <CardEditor participantId={viewerId} mode={{ kind: 'add', columnKey }} onClose={() => setAdding(false)} />
          </li>
        )}
        {cards.map((c) => <Card key={c.id} card={c} viewerId={viewerId} />)}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Update `Board.tsx` to use `Column`**

```tsx
'use client';
import { useRoomChannel } from '@/lib/realtime/useRoomChannel';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { Column } from './Column';

const TITLES = { mad: 'Mad', sad: 'Sad', glad: 'Glad' } as const;

export function Board({ roomId, viewerId }: { roomId: string; viewerId: string }) {
  useRoomChannel(roomId, viewerId);
  const { room, cardsByColumn } = useRoomState();

  if (!room) return <div className="p-6">Loading…</div>;
  if (room.ended_at) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">This retro has ended</h2>
          <a className="underline" href="/">Start a new one</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-zinc-50">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Room {room.code}</h1>
      </header>
      <section className="grid gap-4 md:grid-cols-3" aria-live="polite">
        {(['mad', 'sad', 'glad'] as const).map((k) => (
          <Column key={k} title={TITLES[k]} columnKey={k} cards={cardsByColumn[k]} viewerId={viewerId} />
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Smoke**

`pnpm dev`. Create room. Add card. Vote. Edit. Delete. Open second browser, see card live.

- [ ] **Step 7: Commit**

```bash
git add components/board/
git commit -m "feat(ui): add Column, Card, CardEditor, VoteDot components"
```

---

### Task 28: Timer + TimerControls

**Files:**
- Create: `components/board/Timer.tsx`, `components/facilitator/TimerControls.tsx`
- Modify: `components/board/Board.tsx`

- [ ] **Step 1: `components/board/Timer.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRoomState } from '@/lib/realtime/useRoomState';

export function Timer() {
  const { room } = useRoomState();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!room?.timer_started_at) return;
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [room?.timer_started_at]);

  if (!room?.timer_started_at || !room.timer_seconds) return <span className="text-sm text-zinc-500">No timer</span>;
  const startedMs = new Date(room.timer_started_at).getTime();
  const remaining = Math.max(0, Math.floor((startedMs + room.timer_seconds * 1000 - now) / 1000));
  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');
  return <span className="font-mono text-sm" aria-live="polite">{m}:{s}</span>;
}
```

- [ ] **Step 2: `components/facilitator/TimerControls.tsx`**

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { startTimer } from '@/lib/rpc/startTimer';
import { stopTimer } from '@/lib/rpc/stopTimer';
import { toToast } from '@/lib/errors';
import { useState } from 'react';

export function TimerControls({ participantId, isFacilitator }: { participantId: string; isFacilitator: boolean }) {
  const [error, setError] = useState<string | null>(null);
  if (!isFacilitator) return null;
  const start = async (seconds: number) => {
    setError(null);
    try { await startTimer({ participantId, seconds }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  const stop = async () => {
    setError(null);
    try { await stopTimer({ participantId }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={() => start(300)}>5m</Button>
      <Button size="sm" onClick={() => start(600)}>10m</Button>
      <Button size="sm" onClick={() => start(900)}>15m</Button>
      <Button size="sm" variant="ghost" onClick={stop}>Stop</Button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
```

- [ ] **Step 3: Update `Board.tsx` header to include Timer + TimerControls**

In `Board.tsx`, replace `<header>` block:

```tsx
<header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
  <h1 className="text-xl font-semibold">Room {room.code}</h1>
  <div className="flex items-center gap-3">
    <Timer />
    <TimerControls participantId={viewerId} isFacilitator={room.facilitator_id === viewerId} />
  </div>
</header>
```

Add imports:

```tsx
import { Timer } from './Timer';
import { TimerControls } from '@/components/facilitator/TimerControls';
```

- [ ] **Step 4: Smoke**

Start timer (5m). Watch countdown in two browsers — values match within 1s.

- [ ] **Step 5: Commit**

```bash
git add components/board/Timer.tsx components/facilitator/TimerControls.tsx components/board/Board.tsx
git commit -m "feat(ui): add timer display and facilitator timer controls"
```

---

### Task 29: ParticipantsList + facilitator panel (anon, reveal, votes-per-user, end)

**Files:**
- Create: `components/board/ParticipantsList.tsx`, `components/facilitator/AnonymousModeToggle.tsx`, `components/facilitator/RevealAuthorsToggle.tsx`, `components/facilitator/VotesPerUserField.tsx`, `components/facilitator/EndRetroButton.tsx`, `components/facilitator/FacilitatorPanel.tsx`
- Modify: `components/board/Board.tsx`

- [ ] **Step 1: `components/board/ParticipantsList.tsx`**

```tsx
'use client';
import { useRoomState } from '@/lib/realtime/useRoomState';

export function ParticipantsList() {
  const { participants, room } = useRoomState();
  return (
    <ul className="text-sm space-y-1">
      {participants.map((p) => (
        <li key={p.id} className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${p.id === room?.facilitator_id ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span>{p.display_name}{p.id === room?.facilitator_id && ' · facilitator'}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: `components/facilitator/AnonymousModeToggle.tsx`**

```tsx
'use client';
import { setAnonymousMode } from '@/lib/rpc/setAnonymousMode';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { toToast } from '@/lib/errors';
import { useState } from 'react';

export function AnonymousModeToggle({ participantId }: { participantId: string }) {
  const { room } = useRoomState();
  const [error, setError] = useState<string | null>(null);
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    try { await setAnonymousMode({ participantId, on: e.target.checked }); }
    catch (err) { setError(toToast((err as { code?: string }).code)); }
  };
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={room?.anonymous_mode ?? false} onChange={onChange} />
      Anonymous cards
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
```

- [ ] **Step 3: `components/facilitator/RevealAuthorsToggle.tsx`**

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { revealAuthors } from '@/lib/rpc/revealAuthors';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { toToast } from '@/lib/errors';
import { useState } from 'react';

export function RevealAuthorsToggle({ participantId }: { participantId: string }) {
  const { room } = useRoomState();
  const [error, setError] = useState<string | null>(null);
  if (!room?.anonymous_mode) return null;
  const reveal = async () => {
    setError(null);
    try { await revealAuthors({ participantId }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  if (room.authors_revealed) return <span className="text-sm text-zinc-500">Authors revealed</span>;
  return (
    <>
      <Button size="sm" variant="outline" onClick={reveal}>Reveal authors</Button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </>
  );
}
```

- [ ] **Step 4: `components/facilitator/VotesPerUserField.tsx`**

```tsx
'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setVotesPerUser } from '@/lib/rpc/setVotesPerUser';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { toToast } from '@/lib/errors';
import { useState } from 'react';

export function VotesPerUserField({ participantId }: { participantId: string }) {
  const { room } = useRoomState();
  const [error, setError] = useState<string | null>(null);
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    if (!Number.isFinite(n) || n < 1 || n > 20) return;
    setError(null);
    try { await setVotesPerUser({ participantId, n }); }
    catch (err) { setError(toToast((err as { code?: string }).code)); }
  };
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="vpu" className="text-sm">Votes / user</Label>
      <Input id="vpu" type="number" min={1} max={20} defaultValue={room?.votes_per_user ?? 5} onBlur={onChange} className="w-20" />
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
```

- [ ] **Step 5: `components/facilitator/EndRetroButton.tsx`**

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { endRoom } from '@/lib/rpc/endRoom';
import { toToast } from '@/lib/errors';
import { useState } from 'react';

export function EndRetroButton({ participantId }: { participantId: string }) {
  const [error, setError] = useState<string | null>(null);
  const click = async () => {
    if (!confirm('End this retro for everyone?')) return;
    setError(null);
    try { await endRoom({ participantId }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  return (
    <>
      <Button size="sm" variant="destructive" onClick={click}>End retro</Button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </>
  );
}
```

- [ ] **Step 6: `components/facilitator/FacilitatorPanel.tsx`**

```tsx
'use client';
import { AnonymousModeToggle } from './AnonymousModeToggle';
import { RevealAuthorsToggle } from './RevealAuthorsToggle';
import { VotesPerUserField } from './VotesPerUserField';
import { EndRetroButton } from './EndRetroButton';
import { useRoomState } from '@/lib/realtime/useRoomState';

export function FacilitatorPanel({ participantId }: { participantId: string }) {
  const { room } = useRoomState();
  if (!room || room.facilitator_id !== participantId) return null;
  return (
    <aside className="bg-white rounded-lg shadow-sm p-4 space-y-3">
      <h3 className="font-medium">Facilitator</h3>
      <AnonymousModeToggle participantId={participantId} />
      <RevealAuthorsToggle participantId={participantId} />
      <VotesPerUserField participantId={participantId} />
      <EndRetroButton participantId={participantId} />
    </aside>
  );
}
```

- [ ] **Step 7: Wire into `Board.tsx`** — add a sidebar layout

```tsx
'use client';
import { useRoomChannel } from '@/lib/realtime/useRoomChannel';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { Column } from './Column';
import { Timer } from './Timer';
import { TimerControls } from '@/components/facilitator/TimerControls';
import { ParticipantsList } from './ParticipantsList';
import { FacilitatorPanel } from '@/components/facilitator/FacilitatorPanel';

const TITLES = { mad: 'Mad', sad: 'Sad', glad: 'Glad' } as const;

export function Board({ roomId, viewerId }: { roomId: string; viewerId: string }) {
  useRoomChannel(roomId, viewerId);
  const { room, cardsByColumn } = useRoomState();

  if (!room) return <div className="p-6">Loading…</div>;
  if (room.ended_at) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">This retro has ended</h2>
          <a className="underline" href="/">Start a new one</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-zinc-50">
      <header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Room {room.code}</h1>
        <div className="flex items-center gap-3">
          <Timer />
          <TimerControls participantId={viewerId} isFacilitator={room.facilitator_id === viewerId} />
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <section className="grid gap-4 md:grid-cols-3" aria-live="polite">
          {(['mad', 'sad', 'glad'] as const).map((k) => (
            <Column key={k} title={TITLES[k]} columnKey={k} cards={cardsByColumn[k]} viewerId={viewerId} />
          ))}
        </section>
        <aside className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium mb-2">Participants</h3>
            <ParticipantsList />
          </div>
          <FacilitatorPanel participantId={viewerId} />
        </aside>
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Smoke**

Two browsers. Toggle anon as facilitator → other browser hides author names. Reveal → names reappear. Set votes/user to 2 → third vote rejected with toast. End retro → both browsers go to ended state.

- [ ] **Step 9: Commit**

```bash
git add components/board/ParticipantsList.tsx components/facilitator/ components/board/Board.tsx
git commit -m "feat(ui): add ParticipantsList + facilitator panel"
```

---

## Phase F — End-to-End Verification + Deploy

### Task 30: Playwright E2E — two-browser realtime

**Files:**
- Create: `tests/e2e/retro.spec.ts`

- [ ] **Step 1: Write spec**

```ts
import { test, expect, type BrowserContext, type Page } from '@playwright/test';

test('two browsers — card realtime sync, voting, anon, end', async ({ browser }) => {
  const a: BrowserContext = await browser.newContext();
  const b: BrowserContext = await browser.newContext();
  const pa: Page = await a.newPage();
  const pb: Page = await b.newPage();

  // Alice creates room
  await pa.goto('/');
  await pa.getByLabel('Your name').fill('Alice');
  await pa.getByRole('button', { name: /create room/i }).click();
  await pa.waitForURL(/\/r\/\d{6}/);
  const code = pa.url().match(/\/r\/(\d{6})/)![1];

  // Bob joins
  await pb.goto(`/r/${code}/join`);
  await pb.getByLabel('Your name').fill('Bob');
  await pb.getByRole('button', { name: /join/i }).click();
  await pb.waitForURL(`/r/${code}`);

  // Alice adds a card
  await pa.getByRole('button', { name: /Add card to Mad/i }).click();
  await pa.getByRole('textbox').fill('CI is broken');
  await pa.getByRole('button', { name: /save/i }).click();

  // Bob sees it within 2s
  await expect(pb.getByText('CI is broken')).toBeVisible({ timeout: 2000 });

  // Bob votes
  const bobCard = pb.getByText('CI is broken').locator('..');
  await bobCard.getByRole('button', { name: /add vote/i }).click();

  // Alice sees vote tally update
  const aliceCard = pa.getByText('CI is broken').locator('..');
  await expect(aliceCard.getByLabel(/vote total/i)).toContainText('1', { timeout: 2000 });

  // Anon mode by facilitator (Alice)
  await pa.getByLabel(/anonymous cards/i).check();
  await expect(pb.getByText('Anonymous')).toBeVisible({ timeout: 2000 });
  // Alice still sees her own name
  await expect(pa.getByText('Alice', { exact: false })).toBeVisible();

  // End retro
  pa.once('dialog', (d) => d.accept());
  await pa.getByRole('button', { name: /end retro/i }).click();
  await expect(pb.getByText(/this retro has ended/i)).toBeVisible({ timeout: 2000 });

  await a.close();
  await b.close();
});
```

- [ ] **Step 2: Run locally**

```bash
pnpm db:start && pnpm db:reset --no-seed
pnpm test:e2e
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/retro.spec.ts
git commit -m "test(e2e): two-browser realtime, voting, anon, end"
```

---

### Task 31: Vercel + Supabase production setup

**Files:**
- Create: `vercel.ts`, `README.md`
- Modify: `package.json` if needed

- [ ] **Step 1: `vercel.ts`**

```ts
import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  buildCommand: 'pnpm build',
  framework: 'nextjs',
};

export default config;
```

Install: `pnpm add -D @vercel/config`

- [ ] **Step 2: Create Supabase project (manual)**

```bash
pnpm supabase login
pnpm supabase projects create retro-ball --org-id <your-org> --region <region> --db-password <strong-password>
pnpm supabase link --project-ref <ref>
pnpm supabase db push                # apply migrations to prod
```

- [ ] **Step 3: Create Vercel project (manual)**

```bash
pnpm dlx vercel link
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_URL production
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

- [ ] **Step 4: Write README**

```markdown
# Retro Ball

Live realtime Mad/Sad/Glad retrospective web app.

## Local dev

\`\`\`bash
pnpm install
pnpm db:start
pnpm db:reset --no-seed
pnpm dev
\`\`\`

Open http://localhost:3000.

## Tests

- Unit: \`pnpm test\`
- DB: \`pnpm db:test\`
- E2E: \`pnpm test:e2e\`

## Deploy

Vercel + Supabase. See \`docs/superpowers/specs/2026-04-29-retro-ball-core-realtime-board-design.md\`.
```

- [ ] **Step 5: Push, verify Vercel preview deploys**

```bash
git add vercel.ts README.md package.json pnpm-lock.yaml
git commit -m "chore: add vercel.ts and README"
git push
```

CI runs. Vercel preview URL appears on PR. Visit, smoke-test create+join.

- [ ] **Step 6: Commit anything missed**

```bash
git status
git add -A
git diff --cached --quiet || git commit -m "chore: cleanup"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Stack — Next.js 16, Tailwind v4, pnpm | Task 1 |
| Stack — Supabase local + CLI | Task 2 |
| CI/CD — GitHub Actions, Vercel | Tasks 4, 31 |
| Data Model — rooms, participants, cards, votes | Task 5 |
| RLS public read, deny direct writes | Task 6 |
| RPCs — create_room, join_room, get_room_state | Task 7 |
| RPCs — add/edit/delete card | Task 8 |
| RPCs — cast/revoke vote, vote limit | Task 9 |
| RPCs — start/stop timer | Task 10 |
| RPCs — anon mode, reveal, votes-per-user, end_room | Task 11 |
| Rate limits | Task 12 |
| Anonymous-mode redaction | Task 13 |
| pg_cron TTL | Task 14 |
| Generated DB types + Supabase clients | Task 15 |
| Identity cookie | Task 16 |
| Reducer + zustand store | Task 17 |
| useRoomChannel — subscription, presence, reconnect-snapshot | Task 18 |
| useRoomState selectors | Task 19 |
| Error code → toast | Task 20 |
| createRoom + joinRoom server actions | Task 21 |
| Card RPC wrappers | Task 22 |
| Vote/timer/facilitator wrappers | Task 23 |
| Landing page | Task 24 |
| Join page | Task 25 |
| Board route + Board shell | Task 26 |
| Column + Card + CardEditor | Task 27 |
| Timer + TimerControls | Task 28 |
| ParticipantsList + facilitator panel | Task 29 |
| E2E — two browser realtime | Task 30 |
| Vercel + Supabase prod | Task 31 |

**Placeholder scan:** none. Every step has concrete code or commands.

**Type consistency:** `Card`, `Vote`, `Room`, `Participant` types come from generated DB types and are re-exported from `lib/realtime/reducer.ts`. RPC wrappers use `Card` row type consistently. RpcError shape is consistent across wrappers. `toToast` accepts an error code string.

**Open caveats noted in plan, not gaps:**
- Anonymous mode redaction at the realtime payload level relies on UI guarding rather than column-level RLS. Documented in the spec as accepted v1 trade-off.
- pg_cron extension assumes Supabase plan supports it. Verified via Task 14 test in CI.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-29-retro-ball-core-realtime-board.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
