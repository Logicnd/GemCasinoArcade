# Vercel Setup (Beginner-Friendly)

This guide gets the site fully working on Vercel, step by step. It assumes you are new and want every piece explained.

## 0) What you are deploying
- This app is a Next.js site with server routes (API) and a Postgres database using Prisma.
- Auth is handled by NextAuth (credentials login).
- If the database or auth secrets are missing, the site will show `/api/auth/error` and signup will fail.

## 1) Create a Postgres database
You must have a real Postgres database on the internet so Vercel can connect.

Recommended options:
- Vercel Postgres (simplest if you are already on Vercel)
- Neon
- Supabase (Postgres)

After creating the database, copy the **connection string**. It looks like this:

```
postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
```

If you do not know what "base44" is, it is not required by this repo. This project only needs a Postgres URL.
If "base44" is a hosting service that gives you a Postgres URL, use it as the connection string above.

## 2) Set environment variables on Vercel
Go to:
- Vercel Dashboard -> Your Project -> Settings -> Environment Variables

Add these variables:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
NEXTAUTH_SECRET=your-long-random-secret
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
BCRYPT_ROUNDS=12
```

Optional (some providers set these automatically):

```
POSTGRES_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
```

### What each one does
- `DATABASE_URL`: tells Prisma where your database is.
- `NEXTAUTH_SECRET`: encrypts auth tokens and sessions. It must be long and random.
- `NEXTAUTH_URL`: tells NextAuth the real URL of your site on Vercel.
- `BCRYPT_ROUNDS`: how strong password hashing should be. `12` is safe for production.
- `POSTGRES_URL`: optional alias some platforms add automatically.

### Prisma Accelerate (optional)
If you want Prisma Accelerate / Data Proxy, you will also add:

```
PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=REPLACE_ME
```

Important: this repo currently uses `DATABASE_URL` only. Adding `PRISMA_DATABASE_URL` does nothing unless you update Prisma client initialization to use it.

## 3) Run Prisma migrations on Vercel
Prisma needs to create tables in your production database. Vercel does not do this by default.

In Vercel, go to:
- Project -> Settings -> Build & Output

Set the **Build Command** to:

```
npx prisma migrate deploy && npx prisma generate && npm run build
```

This does three important things:
- `migrate deploy`: creates tables in your production database.
- `prisma generate`: creates the Prisma client code.
- `npm run build`: builds the Next.js app.

## 4) (Optional) Seed initial data
This repo has a seed script that inserts initial config/items/cases.
You only run this once.

On your machine, temporarily set `DATABASE_URL` to your production database URL and run:

```
npx prisma db seed
```

If you are unsure, skip this step. The site still works, but some configs might be missing until seeded.

## 5) Redeploy the project
After setting env vars and build command, go to Vercel and redeploy.

If signup still fails, it is usually because:
- `DATABASE_URL` is wrong
- tables were not created (migrations not run)
- `NEXTAUTH_SECRET` or `NEXTAUTH_URL` are missing

## 6) How to read common errors
- `/api/auth/error`: auth server failed to boot (missing env or DB issue)
- `Signup failed`: the signup API hit an internal error (usually DB not ready)
- Prisma errors mentioning `P1001` or `P1002`: cannot connect to database

## 7) Quick checklist
- [ ] `DATABASE_URL` is correct and accessible from the internet
- [ ] `NEXTAUTH_SECRET` is set (long random value)
- [ ] `NEXTAUTH_URL` matches your Vercel domain
- [ ] Build Command includes `prisma migrate deploy`
- [ ] Redeployed after env var changes

## 8) API routes included in this project
All API routes live in `app/api`:

Auth:
- `POST /api/auth/signup`
- `GET/POST /api/auth/[...nextauth]`

User:
- `GET /api/me`
- `POST /api/settings/update`
- `GET /api/inventory`

Economy:
- `POST /api/economy/daily-claim`

Cases:
- `POST /api/cases/open`

Games:
- Slots: `POST /api/games/slots/spin`
- Mines: `POST /api/games/mines/start`, `POST /api/games/mines/reveal`, `POST /api/games/mines/cashout`
- Plinko: `POST /api/games/plinko/drop`
- Blackjack: `POST /api/games/blackjack/start`, `POST /api/games/blackjack/hit`, `POST /api/games/blackjack/stand`, `POST /api/games/blackjack/double`
- Jackpot: `GET /api/games/jackpot/current-round`, `POST /api/games/jackpot/enter`

Admin (requires role):
- `GET /api/admin/analytics`
- `GET /api/admin/transactions`
- `GET /api/admin/audit`
- `POST /api/admin/users/modify`
- `GET /api/admin/games`

Owner (requires role):
- `POST /api/owner/roles`
- `POST /api/owner/site-config`

## 9) If you want me to customize for your provider
Send me:
- The database provider name (what "base44" actually is)
- The connection string format they give you
- Your Vercel domain

I will write a copy-paste `.env` and exact steps for your provider.
