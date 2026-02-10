# Quick Setup Guide

Get your Gem Casino Arcade running on Vercel in 5 steps.

## Prerequisites

- A GitHub account
- A Vercel account (free tier works fine)
- A PostgreSQL database (we'll help you set this up)

## Step 1: Fork/Clone Repository

1. Fork this repository to your GitHub account
2. Or clone it locally:
   ```bash
   git clone https://github.com/Logicnd/GemCasinoArcade.git
   cd GemCasinoArcade
   ```

## Step 2: Create PostgreSQL Database

Choose one of these options:

### Option A: Vercel Postgres (Easiest)
1. Create a new project on Vercel
2. Go to Storage tab → Create Database → Postgres
3. Done! Environment variables are set automatically

### Option B: Neon (Free tier available)
1. Go to https://neon.tech/
2. Sign up and create a new project
3. Copy the connection string (looks like `postgresql://user:pass@...`)

### Option C: Supabase (Free tier available)
1. Go to https://supabase.com/
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the connection string

## Step 3: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Before deploying, add environment variables:

### Required Environment Variables

```bash
DATABASE_URL=your-postgresql-connection-string
NEXTAUTH_SECRET=generate-this-with-command-below
NEXTAUTH_URL=will-be-your-vercel-url
BCRYPT_ROUNDS=12
```

### Generate NEXTAUTH_SECRET

Run this in your terminal:
```bash
openssl rand -base64 32
```

Copy the output and use it as `NEXTAUTH_SECRET`.

### Set NEXTAUTH_URL

For now, use: `https://your-project-name.vercel.app`

You can update this after deployment with your actual Vercel URL.

## Step 4: Configure Build Command

In Vercel project settings:
1. Go to Settings → Build & Output Settings
2. Override Build Command with:
   ```bash
   npx prisma migrate deploy && npx prisma generate && npm run build
   ```

## Step 5: Deploy!

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Visit your site!

## Verify Deployment

After deployment:

1. **Check health:** Visit `https://your-app.vercel.app/api/health`
   - Should show `{"status":"ok"}`

2. **Create account:** Go to `/signup`
   - First user automatically gets admin privileges

3. **Login:** Go to `/login`
   - Use the credentials you just created

4. **Play:** Start with 1000 gems!
   - Try Slots, Mines, Plinko, or other games

## Optional: Seed Initial Data

After your first successful deployment, seed the database with initial configs and items:

```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull .env.local

# Run seed script
npm run db:seed
```

This adds:
- Default site configuration
- Game settings
- Cosmetic items
- Sample loot cases

## Troubleshooting

If something goes wrong, check these in order:

1. **Visit `/api/health`** - Shows what's wrong
2. **Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Specific error solutions
3. **Review Vercel logs** - Project → Logs tab
4. **Verify environment variables** - Settings → Environment Variables

## Common Issues

- **405 Error:** Using GET instead of POST (check [API.md](API.md))
- **401 Error:** Not logged in (go to `/login`)
- **500 Error:** Database issue (check `/api/health` and [TROUBLESHOOTING.md](TROUBLESHOOTING.md))
- **"Invalid input":** Username/password doesn't meet requirements (see [TROUBLESHOOTING.md](TROUBLESHOOTING.md))

## Next Steps

- **Customize:** Edit site settings in admin panel (first user is admin)
- **Invite friends:** Share your Vercel URL
- **Monitor:** Check Vercel analytics and logs
- **Update:** Push to GitHub and Vercel auto-deploys

## Full Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Error solutions
- [API.md](API.md) - Complete API reference
- [.env.example](.env.example) - Environment variable template

## Getting Help

1. Check the health endpoint: `/api/health`
2. Read [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Check Vercel logs for specific errors
4. Create an issue on GitHub with:
   - Error message
   - Health check response
   - Relevant logs

## Security Checklist

Before going live:
- [ ] Change NEXTAUTH_SECRET from default
- [ ] Use strong password for admin account
- [ ] Enable SSL on database connection
- [ ] Review security settings in Vercel
- [ ] Set up monitoring/alerts

## That's It!

You now have a fully functional casino arcade application running on Vercel. The first user gets admin privileges automatically, so you can configure everything through the admin panel.

**Have fun and gamble responsibly!** 🎰💎

(Remember: This is entertainment only, no real money involved)
