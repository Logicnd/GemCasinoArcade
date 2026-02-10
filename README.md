# Gem Casino Arcade

Entertainment-only, gems-only casino-style arcade built on Next.js App Router with a server-authoritative economy, credentials auth, and Postgres + Prisma.

**No real money. No prizes. No withdrawals. 18+ only.**

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind
- Prisma ORM + PostgreSQL
- Auth.js / NextAuth credentials provider (username + password, bcrypt)
- Zod validation on every API route
- Vitest for unit/integration tests

## Environment
Create a `.env` (see `.env.example`):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gem_casino"
NEXTAUTH_SECRET="generate-a-strong-secret"
NEXTAUTH_URL="http://localhost:3000"
BCRYPT_ROUNDS=12
```

## Database / Prisma
```
npm run prisma:generate
prisma migrate dev          # against your Postgres
npm run db:seed             # seeds configs/items/cases
```
The schema covers: users, sessions, audit logs, gem ledger, configs (site/game/case), cases/items/inventory, mines/blackjack/jackpot rounds.

## Dev Scripts
- `npm run dev` – start Next.js
- `npm run test` – vitest suite (unit + integration)
- `npm run prisma:format` – format schema

## Key Features (Phase 2)
- Credentials auth, DB-backed sessions, first user auto OWNER+ADMIN (transactional).
- Server-authoritative gems: every balance change is a Prisma transaction + `GemTransaction` ledger row.
- Games: Slots, Mines, Plinko, Blackjack, Jackpot (server RNG, HMAC-ready utility).
- Daily bonus with streak + self-limits enforcement (max loss / plays per day).
- Cases + inventory + rarity tiers; case opens logged with RNG metadata.
- Admin APIs: ban/unban, gem adjust, view transactions/audit, edit game configs.
- Owner APIs: role promotion, site config versioning.
- Analytics API: RTP per game + net gem flow.
- Age gate overlay + global disclaimer.

## Deployment (Vercel)
1) Set env vars in Vercel: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.  
2) Ensure the Postgres instance is reachable from Vercel.  
3) Run `prisma migrate deploy` as a build step or via Vercel Postgres integration.  
4) Push to GitHub and connect the repo; Vercel will build with `npm run build`.

Need a beginner-friendly walkthrough? See [docs/vercel-setup.md](docs/vercel-setup.md).

## Safety / Compliance
- Entertainment only, virtual gems only, no purchase/withdraw flows.
- Age gate + responsible play self-limits.
- Banned users blocked at auth and ledger layers.
- Rate limiting on high-frequency game endpoints.

## Tests Included
- Rarity roll and item selection
- Slots payout calculation
- Mines multiplier progression
- Blackjack settlement logic
- RBAC helpers (first user owner/admin), daily-claim guard, banned-user ledger guard

## Next Steps
- Flesh out admin/owner UI panels on top of existing APIs.
- Add provably-fair seed rotation UI and client seed management.
- Harden job to settle jackpot rounds on a schedule.
