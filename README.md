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

Key boundaries:
- Components only call `lib/rpc/*`. Never import `supabase` directly.
- Only `useRoomChannel` opens Realtime subscriptions.
- Postgres RPCs are the single mutation surface — RLS denies direct table writes.
- `lib/identity.ts` is the only owner of the participant cookie.

## License

MIT (placeholder).
