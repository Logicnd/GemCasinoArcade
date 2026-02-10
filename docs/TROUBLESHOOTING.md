# Troubleshooting Common Issues

This guide helps you diagnose and fix common issues when deploying Gem Casino Arcade to Vercel.

## Quick Diagnosis

Visit `/api/health` on your deployed site to see the health status of your application. This will check:
- Environment variables are set
- Database connection is working
- Database migrations have run

Example: `https://your-app.vercel.app/api/health`

## Common Errors and Solutions

### 1. 405 Method Not Allowed on `/api/auth/signup`

**Symptoms:**
- Signup form submits but returns "405 Method Not Allowed"
- Network tab shows POST request failing

**Possible Causes & Solutions:**

#### A. Stale Build Cache
Vercel might be serving an old version of your app.

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Scroll to "Build Cache"
3. Click "Clear Build Cache"
4. Go to Deployments and click "Redeploy"

#### B. Build Failed Partially
The build might have completed but with errors that prevented some routes from being generated.

**Solution:**
1. Go to Vercel Dashboard → Deployments → Latest Deployment
2. Check the build logs for errors
3. Look for the "Route (app)" section - verify `/api/auth/signup` is listed
4. If missing, check for build errors above

Common build errors:
- Font loading errors (should be fixed in latest version)
- TypeScript errors
- Missing dependencies

#### C. Incorrect Build Command
The build command might not be running Prisma migrations.

**Solution:**
1. Go to Settings → Build & Output → Build Command
2. Set it to:
   ```
   npx prisma migrate deploy && npx prisma generate && npm run build
   ```
3. Redeploy

#### D. Environment Variables Not Set
Even if the build succeeds, the route might fail at runtime without proper env vars.

**Solution:**
1. Check `/api/health` to see which env vars are missing
2. Go to Settings → Environment Variables
3. Ensure all of these are set:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `BCRYPT_ROUNDS` (optional, defaults to 12)
4. After adding/changing env vars, redeploy

### 2. 500 Internal Server Error on Signup

**Symptoms:**
- Signup form submits successfully
- Returns "Signup failed" message
- Status code is 500

**Possible Causes:**

#### A. Database Connection Failed
The app can't connect to your database.

**Check `/api/health` output:**
- If `database.status` is "error", your DATABASE_URL is wrong or the database is unreachable
- Verify the connection string format:
  ```
  postgresql://user:password@host:5432/dbname?sslmode=require
  ```
- Make sure the database allows connections from Vercel IPs
- Test the connection string locally

#### B. Database Migrations Not Run
The User table doesn't exist.

**Check `/api/health` output:**
- If `migrations.status` is "error", run migrations:
  ```
  npx prisma migrate deploy
  ```
- Make sure your build command includes `prisma migrate deploy`
- Alternatively, run migrations manually from your local machine pointing to the production database:
  ```bash
  DATABASE_URL="your-production-url" npx prisma migrate deploy
  ```

#### C. Bcrypt Hashing Error
Rare but can happen if bcrypt isn't installed properly.

**Solution:**
- Check deployment logs for bcrypt errors
- Ensure `bcrypt` is in `dependencies`, not `devDependencies` (it already is in this project)

### 3. 401 Unauthorized After Signup

**Symptoms:**
- Signup succeeds
- Automatic login after signup fails
- User is not logged in

**Possible Causes:**

#### A. NextAuth Configuration Issue
NEXTAUTH_SECRET or NEXTAUTH_URL might be incorrect.

**Solution:**
1. Verify `NEXTAUTH_SECRET` is set to a long random string (at least 32 characters)
2. Verify `NEXTAUTH_URL` matches your Vercel domain exactly:
   - Production: `https://your-app.vercel.app`
   - Preview: `https://your-app-git-branch.vercel.app`
3. After changing these, redeploy

#### B. Session Cookie Issues
Cookies might not be setting correctly.

**Check in browser DevTools:**
1. Go to Application → Cookies
2. Look for `gca.session-token`
3. If missing, check if third-party cookies are blocked
4. Make sure your domain doesn't have mixed HTTP/HTTPS issues

### 4. Invalid Login After Creating Account

**Symptoms:**
- Signup succeeds
- Login form shows "Invalid credentials" or similar error

**Possible Causes:**

#### A. User Was Created But Login Info Incorrect
Double-check you're using the exact same username and password.

**Solution:**
- Usernames are case-sensitive
- Check for extra spaces
- Try creating a new account with a different username

#### B. Database Transaction Failed Partially
The user might have been created without proper password hash.

**Solution:**
- Check Vercel function logs for errors during signup
- If you see transaction errors, your database might be having issues
- Try signing up again

### 5. Build Fails with "Failed to fetch fonts"

**Symptoms:**
- Build fails with Google Fonts errors
- Error mentions `Geist` or `Geist Mono`

**Status:** This should be fixed in the latest version.

**If you still see this:**
1. Make sure you're on the latest commit
2. Verify `app/layout.tsx` doesn't import Google Fonts
3. The app now uses system fonts as fallback

### 6. Prisma Error: "Can't reach database server"

**Symptoms:**
- Any API call returns 500
- Logs show Prisma connection errors
- `/api/health` shows database error

**Solutions:**

#### A. Check Connection String Format
```
postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
```

Common mistakes:
- Missing `?sslmode=require` (some providers require SSL)
- Wrong port (default is 5432)
- Special characters in password not URL-encoded
- Using `postgres://` instead of `postgresql://`

#### B. Firewall/IP Restrictions
Some database providers restrict connections by IP.

**Solution:**
- Check your database provider's firewall settings
- Vercel uses dynamic IPs, so you might need to allow all IPs
- Some providers have a "Vercel Integration" that handles this automatically

#### C. Database Doesn't Exist
The database name in your connection string might be wrong.

**Solution:**
- Create the database first
- Then run migrations
- Verify the database name matches your connection string

## Still Having Issues?

### Collect Debug Information

1. **Check `/api/health`** - capture the full JSON response
2. **Check Vercel Deployment Logs** - look for errors during build
3. **Check Vercel Function Logs** - Runtime tab → Functions → View logs
4. **Browser Console** - Check for errors in the browser console
5. **Network Tab** - Capture failed request/response details

### What to Include When Asking for Help

1. The error message you're seeing
2. The output of `/api/health`
3. Relevant logs from Vercel
4. What you've already tried
5. Your database provider (Vercel Postgres, Neon, Supabase, etc.)

## Prevention Checklist

Before deploying, make sure:

- [ ] All environment variables are set correctly
- [ ] Build command includes Prisma migrate and generate
- [ ] Database is accessible from the internet
- [ ] Database migrations have been run
- [ ] You've tested locally with similar configuration
- [ ] You've cleared Vercel's build cache if redeploying
