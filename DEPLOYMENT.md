# Deployment Guide

This guide helps you deploy the Gem Casino Arcade to Vercel and troubleshoot common issues.

## Quick Start Checklist

Before deploying, ensure you have:

- [ ] A PostgreSQL database (Vercel Postgres, Neon, Supabase, etc.)
- [ ] Database connection string ready
- [ ] A strong random secret for NextAuth

## Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Storage" tab
4. Click "Create Database" → "Postgres"
5. Vercel will automatically set `POSTGRES_URL` and related variables

### Option B: External Database (Neon, Supabase, etc.)

1. Create a PostgreSQL database with your provider
2. Copy the connection string (format: `postgresql://user:password@host:5432/dbname`)
3. You'll add this as `DATABASE_URL` in Step 2

## Step 2: Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

### Required Variables

```bash
# Database connection (use your actual connection string)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# NextAuth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-generated-secret-here

# Your Vercel domain (or custom domain)
NEXTAUTH_URL=https://your-app.vercel.app

# Password hashing rounds (12 is recommended)
BCRYPT_ROUNDS=12
```

### How to Generate NEXTAUTH_SECRET

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

**Important:** Never commit your actual secrets to Git!

## Step 3: Configure Build Command

In Vercel Dashboard → Your Project → Settings → Build & Output Settings:

Set **Build Command** to:

```bash
npx prisma migrate deploy && npx prisma generate && npm run build
```

This ensures:
1. Database tables are created/updated (`migrate deploy`)
2. Prisma client is generated (`generate`)
3. Next.js app is built (`build`)

## Step 4: Deploy

1. Push your code to GitHub
2. Vercel will automatically detect changes and deploy
3. Or manually trigger a deployment from Vercel dashboard

## Step 5: Seed Initial Data (Optional but Recommended)

After your first successful deployment, seed the database with initial data:

### Option A: From Your Local Machine

```bash
# Set DATABASE_URL to your production database temporarily
export DATABASE_URL="your-production-database-url"

# Run the seed script
npm run db:seed

# Unset the variable
unset DATABASE_URL
```

### Option B: Using Vercel CLI

```bash
vercel env pull .env.local
npm run db:seed
```

The seed script creates:
- Default site configuration
- Game configuration settings
- Initial cosmetic items
- Sample loot cases

## Troubleshooting Common Errors

### Error: "Signup failed" (500)

**Causes:**
- Database not accessible from Vercel
- Database tables not created (migrations not run)
- DATABASE_URL is incorrect

**Solutions:**
1. Verify DATABASE_URL is correct in Vercel environment variables
2. Ensure your database allows connections from Vercel's IP range
3. Check that build command includes `prisma migrate deploy`
4. Redeploy after fixing environment variables

### Error: 405 Method Not Allowed

**Cause:** Trying to access an API endpoint with the wrong HTTP method

**Example:**
- Accessing `POST /api/auth/signup` with a GET request
- Check your frontend code is using the correct method

**API Method Reference:**
- `/api/auth/signup` → POST only
- `/api/auth/[...nextauth]` → GET and POST
- `/api/me` → GET only
- `/api/games/*/start` → POST only

### Error: 401 Unauthorized

**Causes:**
- Not logged in
- Session expired
- NEXTAUTH_SECRET mismatch between deployments

**Solutions:**
1. Clear cookies and login again
2. Verify NEXTAUTH_SECRET hasn't changed
3. Check NEXTAUTH_URL matches your actual domain

### Error: "Cannot connect to database" (Prisma P1001/P1002)

**Causes:**
- DATABASE_URL is wrong
- Database is not accessible from internet
- SSL/TLS configuration issue

**Solutions:**
1. Verify connection string format
2. Add `?sslmode=require` to connection string if needed
3. Check database firewall allows Vercel connections
4. For Vercel Postgres, ensure you're using the correct URL (POSTGRES_URL vs POSTGRES_PRISMA_URL)

### Error: "Invalid input" on signup

**Causes:**
- Frontend sending incorrect data format
- Validation requirements not met

**Requirements:**
- Username: 3-32 characters, alphanumeric + underscore only
- Password: 8-128 characters
- publicTag: optional, 1-20 characters if provided

**Check your request body:**
```json
{
  "username": "validuser123",
  "password": "securepass123",
  "publicTag": "Optional Tag"
}
```

### Build Warnings About Deprecated Packages

Some dependency warnings are expected and don't affect functionality:
- npm deprecation warnings are informational
- Next.js will continue to work with these warnings

If you want to suppress them, you can add to `package.json`:
```json
{
  "overrides": {
    "inflight": "^1.0.6"
  }
}
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Yes | Random secret for auth encryption | `generate-with-openssl-rand` |
| `NEXTAUTH_URL` | Yes | Your app's public URL | `https://myapp.vercel.app` |
| `BCRYPT_ROUNDS` | Yes | Password hashing strength (10-12) | `12` |
| `NODE_ENV` | Auto | Environment (Vercel sets this) | `production` |
| `POSTGRES_URL` | Auto* | Vercel Postgres sets this | Same as DATABASE_URL |
| `PRISMA_DATABASE_URL` | No | Only for Prisma Accelerate | `prisma+postgres://...` |

*Auto = Automatically set by hosting provider

## Database Connection String Formats

### Standard PostgreSQL
```
postgresql://username:password@hostname:5432/database
```

### With SSL (Recommended for production)
```
postgresql://username:password@hostname:5432/database?sslmode=require
```

### Vercel Postgres (Pooled)
```
postgresql://user:pass@region.pooler.supabase.com:5432/postgres
```

### Supabase
```
postgresql://postgres:password@db.projectref.supabase.co:5432/postgres
```

### Neon
```
postgresql://user:pass@region.neon.tech/dbname?sslmode=require
```

## Verifying Deployment Success

1. **Check Health Endpoint:** Visit `/api/health` - should return `{"status":"ok"}` if everything is configured correctly
   - If status is "warning": check environment variables
   - If status is "error": database connection issue
2. **Check Homepage:** Visit your Vercel URL - it should load without errors
3. **Test Signup:** Go to `/signup` and create a test account
4. **Test Login:** Go to `/login` and sign in with your test account
5. **Check API:** Visit `/api/me` - should return user data if logged in

## Security Checklist

Before going live:

- [ ] `NEXTAUTH_SECRET` is strong and random (not the default)
- [ ] `NEXTAUTH_URL` matches your actual domain
- [ ] Database credentials are secure and not exposed
- [ ] `.env` files are in `.gitignore` (they should be)
- [ ] SSL is enabled for database connections
- [ ] CORS is properly configured (Next.js handles this by default)

## Performance Tips

1. **Use Connection Pooling:** Vercel Postgres includes this automatically
2. **Enable Prisma Accelerate:** For faster queries (optional, requires setup)
3. **Monitor Database:** Watch for slow queries in production

## Getting Help

If you're still stuck:

1. Check Vercel deployment logs: Project → Deployments → [Latest] → View Details
2. Check runtime logs: Project → Logs
3. Review this repository's issues: https://github.com/Logicnd/GemCasinoArcade/issues
4. Provide specific error messages when asking for help

## Updating After Deployment

When you push code changes:

1. Vercel automatically rebuilds and deploys
2. Prisma migrations run automatically (if build command is set correctly)
3. No downtime for users

For database schema changes:

```bash
# Create migration locally
npx prisma migrate dev --name your_migration_name

# Commit and push
git add prisma/migrations
git commit -m "Add migration: your_migration_name"
git push

# Vercel will run the migration on next deploy
```

## Advanced: Multiple Environments

To set up staging and production:

1. Create separate projects in Vercel (or use preview deployments)
2. Use different databases for each environment
3. Set environment variables per environment in Vercel
4. Configure branch-specific deployments

## Support

For issues specific to this application, create an issue on GitHub.

For Vercel-specific issues, check: https://vercel.com/docs
For Prisma issues, check: https://www.prisma.io/docs
