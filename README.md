# Gem Casino Arcade

Entertainment-only, gems-only casino-style arcade built on Next.js App Router with a server-authoritative economy, credentials auth, and Postgres + Prisma.

**No real money. No prizes. No withdrawals. 18+ only.**

---

## 🎯 New to Deployment? Start Here!

**[→ QUICKSTART.md](QUICKSTART.md)** - Deploy to Vercel in 5 steps (beginner-friendly)

Already familiar with deployment? Continue reading below for local development setup.

---

## 🚀 Quick Start

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/Logicnd/GemCasinoArcade.git
   cd GemCasinoArcade
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Set up the database:**
   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Visit http://localhost:3000**

### Production Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for a complete guide to deploying on Vercel with step-by-step instructions and troubleshooting.

Quick deployment checklist:
- Set up PostgreSQL database (Vercel Postgres recommended)
- Configure environment variables in Vercel
- Set build command: `npx prisma migrate deploy && npx prisma generate && npm run build`
- Deploy!

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind
- Prisma ORM + PostgreSQL
- Auth.js / NextAuth credentials provider (username + password, bcrypt)
- Zod validation on every API route
- Vitest for unit/integration tests

## Environment Variables

Required variables (see `.env.example` for detailed documentation):
```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"  # or your production URL
BCRYPT_ROUNDS=12
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
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

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 🚀 Deploy to Vercel in 5 steps (start here!)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide with detailed instructions
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common errors and how to fix them (401, 405, 500, etc.)
- **[API.md](API.md)** - Complete API endpoint reference with examples
- **[docs/vercel-setup.md](docs/vercel-setup.md)** - Beginner-friendly Vercel walkthrough
- **[.env.example](.env.example)** - Environment variables template with explanations

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
