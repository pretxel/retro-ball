# Retro Ball

Live realtime Mad/Sad/Glad retrospective web app for agile teams.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Realtime + RPCs)
- zustand (client state)
- Vitest + Playwright (testing)
- Deployed to Vercel + Supabase

## Local Development

Prerequisites: Node 20+, pnpm 9+, Docker (for local Supabase).

```bash
pnpm install
pnpm db:start          # boot local Supabase (Docker)
pnpm db:reset --no-seed
pnpm dev               # http://localhost:3000
```

## Tests

```bash
pnpm test              # vitest unit
pnpm db:test           # pgTAP DB tests
pnpm test:e2e          # Playwright E2E (requires running dev server + Supabase)
pnpm typecheck         # tsc --noEmit
pnpm lint              # eslint
```

## Production Deploy

### One-time Supabase setup

```bash
pnpm supabase login
pnpm supabase projects create retro-ball --org-id <YOUR_ORG_ID> --region <REGION> --db-password <STRONG_PASSWORD>
pnpm supabase link --project-ref <PROJECT_REF>
pnpm supabase db push                # apply migrations to prod
```

### One-time Vercel setup

```bash
pnpm dlx vercel link
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_URL production
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

Subsequent deploys happen automatically on push to `main` (preview deploys on PRs).

## Architecture

See `docs/superpowers/specs/2026-04-29-retro-ball-core-realtime-board-design.md` for the full design and `docs/superpowers/plans/2026-04-29-retro-ball-core-realtime-board.md` for the implementation plan.

## v1 limitations

- **Anonymous mode is "polite", not security.** When anon mode is on, the UI hides author names from non-authors, but the underlying card row (including `author_id`) is still streamed via Supabase Realtime. A determined participant could read it via browser devtools. Sub-project #2 will address this via server-side broadcast channels.
- **No authentication.** v1 uses HTTP-only cookies for participant identity. Anyone with the room code + a participant cookie can act as that participant. Tokens have a 48-hour TTL and rooms expire after 24h of inactivity.
- **Local-clock timer.** The countdown timer uses each browser's local clock. Browsers with skewed clocks will show slightly different remaining times.
- **Single template.** Only Mad/Sad/Glad. Custom column configurations and other formats are sub-project #3.
- **No persistence beyond 24h.** Rooms are ephemeral. Use a screenshot for retro records.

Key boundaries:
- Components only call `lib/rpc/*`. Never import `supabase` directly.
- Only `useRoomChannel` opens Realtime subscriptions.
- Postgres RPCs are the single mutation surface — RLS denies direct table writes.
- `lib/identity.ts` is the only owner of the participant cookie.

## License

MIT (placeholder).
