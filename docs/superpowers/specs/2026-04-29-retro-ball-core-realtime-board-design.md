# Retro Ball — Core Realtime Board (v1) Design

**Status:** Draft for review
**Date:** 2026-04-29
**Sub-project:** #1 of multi-tenant SaaS roadmap
**Scope:** Core realtime retrospective board, ephemeral, no auth, single template

## Context

`retro-ball` will become a multi-tenant SaaS for agile retrospectives. The full product spans six sub-projects: (1) core realtime board, (2) auth + workspaces, (3) retro flow + templates, (4) billing, (5) integrations, (6) admin/analytics. Each sub-project gets its own spec → plan → build cycle.

**This spec covers sub-project #1 only** — the core interactive board. It is the heart of the product and the hardest piece (live realtime collaboration). Everything else layers on top later.

The v1 deliverable is a publicly shareable web app where any team can run a Mad/Sad/Glad retrospective: one person creates a room, shares a 6-digit code, teammates join, write cards live, vote, and discuss. No accounts, no persistence beyond 24 hours.

## Goals

- Ship a polished, usable Mad/Sad/Glad retro experience in v1.
- Validate the realtime collaboration architecture before layering auth/billing.
- Latency target: card → remote render < 500ms p95.
- Support ~20 concurrent participants per room.

## Non-Goals (v1)

- User accounts, login, workspaces, multi-tenant isolation (sub-project #2).
- Templates other than Mad/Sad/Glad (sub-project #3).
- Phases, action items, card grouping, comments, reactions (sub-project #3).
- Billing, plans, seat limits (sub-project #4).
- Integrations (Jira, Slack) (sub-project #5).
- Admin analytics, exports, history (sub-project #6).
- Mobile-native apps. Web responsive only.

## Product Decisions

| Decision | Choice |
|---|---|
| Project trajectory | Multi-tenant SaaS, decomposed into 6 sub-projects |
| v1 scope | Sub-project #1: core realtime board only |
| Interaction model | Live realtime — cards, votes, presence visible instantly |
| Identity (v1) | Room code + display name, cookie-based participant ID. No accounts. |
| Templates (v1) | Mad / Sad / Glad only |
| Voting | Dot voting, configurable N votes per user (default 5) |
| Vote visibility | Always visible (no reveal phase) |
| Anonymous mode | Per-board toggle. Authors hidden until facilitator reveals. |
| Timer | Facilitator-controlled countdown, visible to all |
| Facilitator | Room creator, automatic. Can run timer, reveal authors, delete any card, end retro. |
| Card editing | Always editable by author |
| Display name uniqueness | Not enforced |
| Persistence | Ephemeral — Postgres rows with TTL cleanup, rooms deleted 24h after last activity |
| Room code format | 6-digit numeric (e.g. `482915`) |
| Stack | Next.js 16 App Router + TypeScript, Tailwind v4, shadcn/ui, Supabase (Postgres + Realtime), Vercel deploy |
| Package manager | pnpm |

## Architecture

### Three planes

1. **UI** — Next.js App Router on Vercel. Server Components for static shell, Client Components for the live board. Tailwind v4 + shadcn/ui.
2. **Data + realtime** — Supabase Postgres holds source of truth. Supabase Realtime publishes Postgres change streams to subscribed clients, filtered by `room_id`.
3. **Mutations** — All writes go through Supabase RPC functions (`security definer`). Client never inserts/updates directly. RLS denies direct writes; reads are public per-room. RPCs enforce authorization (facilitator-only actions, vote limits, ownership).

```
┌──────────────────┐         ┌──────────────────────────┐
│ Browser (Next.js)│ ◄─────► │ Supabase                 │
│ - React UI       │  HTTPS  │ - Postgres (rooms,       │
│ - Realtime client│         │   participants, cards,   │
│   subscribes to  │  WSS    │   votes)                 │
│   room channels  │ ◄─────► │ - Realtime (Postgres     │
│                  │         │   change streams)        │
│                  │  RPC    │ - RPC functions (cast    │
│                  │ ◄─────► │   vote, reveal, end)     │
└──────────────────┘         │ - pg_cron (TTL cleanup)  │
        ▲                    └──────────────────────────┘
        │ HTTPS
        ▼
┌──────────────────┐
│ Vercel           │
│ - Next.js app    │
│ - Server actions │
└──────────────────┘
```

### Identity (v1, pre-auth)

- Facilitator hits `Create retro` → server RPC creates `rooms` row + first `participants` row marked `is_facilitator=true`. Sets HTTP-only cookie `retroball_pid={participant_id}` scoped to `/r/{code}`.
- Participant hits `/r/{code}/join` → enters display name → RPC creates `participants` row, sets cookie.
- All subsequent RPCs read `participant_id` from cookie. The cookie is the v1 identity primitive; it will be replaced by an authenticated user ID in sub-project #2.

### Persistence + TTL

- All state in Postgres.
- `pg_cron` job runs hourly: `DELETE FROM rooms WHERE last_activity_at < now() - interval '24 hours'`. Cascade deletes participants/cards/votes.
- Every successful RPC bumps `rooms.last_activity_at = now()`.

## Data Model

```sql
create table rooms (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,                 -- 6-digit numeric, generated server-side
  template          text not null default 'mad-sad-glad',
  facilitator_id    uuid references participants(id) on delete set null,
                                                          -- nullable: room is inserted first, facilitator participant inserted next, then room.facilitator_id updated, all in one transaction
  anonymous_mode    boolean not null default false,
  votes_per_user    int not null default 5,
  authors_revealed  boolean not null default false,       -- only meaningful when anonymous_mode=true
  timer_started_at  timestamptz,
  timer_seconds     int,
  ended_at          timestamptz,
  created_at        timestamptz not null default now(),
  last_activity_at  timestamptz not null default now()
);
create index on rooms (last_activity_at);
create index on rooms (code);

create table participants (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid not null references rooms(id) on delete cascade,
  display_name    text not null check (length(display_name) between 1 and 40),
  is_facilitator  boolean not null default false,
  joined_at       timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);
create index on participants (room_id);

create table cards (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references rooms(id) on delete cascade,
  column_key  text not null check (column_key in ('mad','sad','glad')),
  author_id   uuid not null references participants(id) on delete cascade,
  body        text not null check (length(body) between 1 and 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on cards (room_id);

create table votes (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references rooms(id) on delete cascade,
  card_id     uuid not null references cards(id) on delete cascade,
  voter_id    uuid not null references participants(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index on votes (room_id);
create index on votes (voter_id);
-- intentionally no unique (card_id, voter_id) — dot voting allows multiple dots on same card
```

**Vote tally:** computed client-side from streamed `votes` rows. Not stored.

**Anonymous mode:** clients render `Anon` instead of author name when `room.anonymous_mode = true AND room.authors_revealed = false AND card.author_id != current_participant_id`. Postgres view + RLS column-level policy ensures `author_id` is redacted to other clients in the realtime payload until reveal. (See Open Questions if Realtime cannot enforce column-level RLS — fallback is broadcast-channel events instead of `postgres_changes` for new cards while anon-mode is on.)

## RPC Surface

All RPCs are `security definer` Postgres functions. Client passes `p_participant_id` (read from cookie); server validates participant belongs to room.

| RPC | Caller | Effect |
|---|---|---|
| `create_room()` | Anonymous | Insert room + facilitator participant. Returns `{room_id, code, participant_id}`. |
| `join_room(p_code, p_display_name)` | Anonymous | Verify room exists + active. Insert participant. Returns `{room_id, participant_id}`. |
| `add_card(p_participant_id, p_column_key, p_body)` | Participant | Insert card. Returns row. |
| `edit_card(p_participant_id, p_card_id, p_body)` | Author only | Update body + updated_at. |
| `delete_card(p_participant_id, p_card_id)` | Author or facilitator | Delete row. |
| `cast_vote(p_participant_id, p_card_id)` | Participant | Validate count < votes_per_user. Insert vote. |
| `revoke_vote(p_participant_id, p_card_id)` | Participant | Delete one vote row by participant on card. |
| `start_timer(p_participant_id, p_seconds)` | Facilitator | Set timer_started_at + timer_seconds. |
| `stop_timer(p_participant_id)` | Facilitator | Clear timer fields. |
| `reveal_authors(p_participant_id)` | Facilitator | Set authors_revealed=true. |
| `set_anonymous_mode(p_participant_id, p_on)` | Facilitator | Toggle anonymous_mode. Reset authors_revealed=false when turning on. |
| `set_votes_per_user(p_participant_id, p_n)` | Facilitator | Update room. Validation: 1 ≤ n ≤ 20. |
| `end_room(p_participant_id)` | Facilitator | Set ended_at. |
| `get_room_state(p_room_id)` | Anonymous | Returns full snapshot: room + participants + cards + votes. |

Every successful mutation also updates `rooms.last_activity_at`.

## Realtime Sync

Each client opens **one Supabase Realtime channel per room**: `room:{room_id}`.

Subscribes to:

- `postgres_changes` on `rooms` (filter `id=eq.{room_id}`) — facilitator state, timer, anon toggles.
- `postgres_changes` on `participants` (filter `room_id=eq.{room_id}`) — join/leave events.
- `postgres_changes` on `cards` (filter `room_id=eq.{room_id}`) — card add/edit/delete.
- `postgres_changes` on `votes` (filter `room_id=eq.{room_id}`) — vote add/delete (drives tally).
- `presence` — online status per `participant_id`. No DB write needed.

**Initial snapshot:** on join/load, client calls `get_room_state(room_id)` once to seed local state. Realtime deltas merge in afterward.

**Reconnect:** Supabase client auto-reconnects. On `SUBSCRIBED` after a `CLOSED`, client refetches snapshot to fill the gap.

**Optimistic UI:** mutations apply locally first, reconcile on the Realtime echo. Server is source of truth — conflict resolution = server wins.

## Component Breakdown

```
retro-ball/
├── app/
│   ├── page.tsx                       # Landing: "Create retro" / "Join with code"
│   ├── r/[code]/page.tsx              # Board route, server shell
│   └── r/[code]/join/page.tsx         # Display-name entry
├── components/
│   ├── board/
│   │   ├── Board.tsx                  # Client root, owns subscription + presence
│   │   ├── Column.tsx                 # Mad | Sad | Glad
│   │   ├── Card.tsx                   # Body, author/Anon, vote count, action buttons
│   │   ├── CardEditor.tsx             # Add/edit form, 500 char limit, optimistic
│   │   ├── VoteDot.tsx                # Single dot indicator
│   │   ├── Timer.tsx                  # Display + facilitator-only controls
│   │   └── ParticipantsList.tsx       # Presence sidebar
│   ├── facilitator/
│   │   ├── RevealAuthorsToggle.tsx
│   │   ├── EndRetroButton.tsx
│   │   ├── AnonymousModeToggle.tsx
│   │   └── TimerControls.tsx
│   └── ui/                            # shadcn primitives
├── lib/
│   ├── supabase/
│   │   ├── browser.ts                 # createBrowserClient
│   │   ├── server.ts                  # createServerClient w/ cookies
│   │   └── types.ts                   # generated DB types (supabase gen types)
│   ├── realtime/
│   │   ├── useRoomChannel.ts          # subscription lifecycle + presence
│   │   ├── useRoomState.ts            # snapshot + delta merge → store
│   │   └── store.ts                   # zustand store
│   ├── rpc/                           # one file per RPC, optimistic + reconcile
│   │   ├── createRoom.ts
│   │   ├── joinRoom.ts
│   │   ├── addCard.ts
│   │   ├── editCard.ts
│   │   ├── deleteCard.ts
│   │   ├── castVote.ts
│   │   ├── revokeVote.ts
│   │   ├── startTimer.ts
│   │   ├── stopTimer.ts
│   │   ├── revealAuthors.ts
│   │   ├── setAnonymousMode.ts
│   │   ├── setVotesPerUser.ts
│   │   └── endRoom.ts
│   ├── identity.ts                    # Cookie read/write for participant_id (single source)
│   └── room-code.ts                   # Generate 6-digit numeric codes, retry on collision
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql              # Tables, RLS, RPCs, view, pg_cron
│   └── seed.sql
├── tests/
│   ├── e2e/                           # Playwright: 2-browser realtime tests
│   └── unit/                          # Vitest
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── vercel.ts
└── README.md
```

### Boundary contracts

- Components never call `supabase` directly — go through `lib/rpc/*`.
- `useRoomChannel` is the **only** subscriber; everything else reads from `store`.
- Postgres RPCs are the **only** mutation surface — DB writes are unreachable from the client.
- `lib/identity.ts` is the single owner of "who am I" cookie reads/writes.

### Component responsibilities

| Component | Purpose | Reads | Writes |
|---|---|---|---|
| `Board` | Mounts subscription, lays out columns + sidebar + timer | `useRoomState` | — |
| `Column` | Renders cards filtered by `column_key`, add button | `useRoomState` | — (delegates to children) |
| `Card` | Body, author/Anon, vote count, edit/delete/vote actions | `useRoomState` | `castVote`, `revokeVote`, `editCard`, `deleteCard` |
| `CardEditor` | Add/edit form, char counter, optimistic submit | — | `addCard`, `editCard` |
| `Timer` | Shows remaining = `(timer_started_at + timer_seconds) - now()`, ticks locally | `useRoomState` | — (controls is separate) |
| `TimerControls` | Facilitator buttons: 5/10/15 min start, stop | — | `startTimer`, `stopTimer` |
| `ParticipantsList` | Online dot, display names, facilitator badge | `useRoomState` (presence) | — |
| `useRoomChannel` | Owns Supabase channel lifecycle | `supabase/browser` | dispatches to `store` |
| `useRoomState` | Selectors over store | `store` | — |

## Error Handling

| Failure | Detection | Response |
|---|---|---|
| RPC rejection (vote limit, not facilitator, room ended, body too long) | Postgres `raise exception` with stable error code | RPC wrapper catches, surfaces toast, rolls back optimistic UI |
| Realtime disconnect | Supabase channel `CLOSED` event | "Reconnecting…" banner, auto-resubscribe, refetch snapshot on reconnect |
| Room not found / 404 | RPC returns null | Redirect to `/` with "room expired or invalid" message |
| Room ended mid-session | `rooms.ended_at` change pushed via Realtime | Modal "Facilitator ended this retro" → read-only mode |
| Cookie missing (cleared by user) | `identity.ts` returns null on board route | Redirect to `/r/{code}/join` to re-enter name (creates new participant; old votes/cards orphaned — accepted v1) |
| Network offline | `navigator.onLine` events | Banner. Block writes. No mutation queueing in v1. |
| Duplicate vote past limit (concurrent) | Postgres function `count(*)` inside transaction | Reject with `vote_limit_reached` error |
| Body validation | DB check constraint + client-side check | Inline editor error |
| Room code collision on create | Unique constraint violation | Server retries up to 5 times with new code, else 500 |

**Error codes:** Postgres functions raise with stable codes (e.g. `not_facilitator`, `vote_limit_reached`, `room_ended`, `not_in_room`, `not_card_owner`). RPC wrappers map to user-facing toast strings.

## Testing

- **Unit (Vitest):** RPC wrappers (mock Supabase client), store reducers, `room-code` generator, `identity.ts` cookie helpers, vote-tally selectors, Timer remaining-time calculation.
- **Postgres function tests (pgTAP):** vote-limit enforcement, facilitator-only guards, anon-mode column redaction, room-not-ended check, ownership check on edit/delete, TTL cleanup logic. Run in CI against ephemeral Supabase.
- **E2E (Playwright):** two browser contexts join same room — card from A appears in B within 2s; vote from A reflects in B; anon mode hides A's name from B but not from A; facilitator-only buttons absent for non-facilitator; timer ticks consistently across both contexts; `end_room` puts both into read-only state.
- **Manual smoke:** four-tab session run before each release.

## CI/CD

- GitHub Actions: typecheck → lint → vitest → supabase migrations apply → pgTAP → playwright headless.
- Vercel preview deploy per PR. Production deploy on `main`.
- Supabase migrations run via Supabase CLI in CI; production migration applied on release.
- Environment variables managed via `vercel env` and `vercel.ts` config.

## Non-Functional Requirements

- **Latency:** card → remote render < 500ms p95 within same region.
- **Concurrency:** 20 participants per room. Load test with 20 simulated WS clients in CI.
- **Rate limits (per participant):** 30 cards/min, 60 votes/min, 60 edits/min — enforced via Postgres function counters.
- **Accessibility:** keyboard navigation for add/edit/vote, ARIA live region announces incoming cards, color contrast ≥ AA.
- **Security:** all client writes are RPC-only (RLS denies direct table writes). Anon Supabase key only. No service-role key in browser. Cookies are HTTP-only and `SameSite=Lax`.

## Sub-Project Boundary

This sub-project ends when:

- A user can create a room, share its 6-digit code, get teammates to join, run a Mad/Sad/Glad retro with voting, anonymous mode, and a timer, and the room cleans itself up after 24h of inactivity.
- All tests above pass in CI.
- The system is deployed to Vercel + Supabase in production.

The next sub-project (#2: auth + workspaces) will replace cookie-based identity with authenticated user IDs and add multi-tenant workspace isolation. The data model anticipates this: `participants` rows become joined to a `users` table; `rooms` gain a `workspace_id`. No v1 schema changes are needed beyond additive columns.

## Risks

| Risk | Mitigation |
|---|---|
| Supabase Realtime does not enforce column-level RLS in change payloads | Verify on day 1 with a spike. If it fails: switch anon-mode card events from `postgres_changes` to a Supabase broadcast channel where the server emits redacted payloads via an Edge Function trigger. |
| 20-participant load fights Supabase free-tier connection limits | Free tier currently allows 200 concurrent connections; safe for v1. Document upgrade path. |
| 6-digit code collision at scale | 1M codes available; with 24h TTL, collision risk is negligible at expected v1 usage. Server retries on conflict. |
| pg_cron not available on Supabase plan | Confirm extension availability before plan. Fallback: scheduled Vercel cron hits a cleanup RPC. |
