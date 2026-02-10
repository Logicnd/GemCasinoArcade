# Troubleshooting Common Deployment Errors

This guide addresses specific errors encountered during deployment and how to fix them.

## Quick Diagnosis: Use the Health Check Endpoint

Visit `/api/health` on your deployed site to quickly identify configuration issues:

```bash
curl https://your-app.vercel.app/api/health
```

**Healthy Response:**
```json
{
  "status": "ok",
  "message": "Application is healthy",
  "database": "connected",
  "environment": "configured"
}
```

If you see anything other than "ok", follow the troubleshooting steps below.

---

## Error: 405 Method Not Allowed

### What It Means
You're trying to access an API endpoint with the wrong HTTP method.

### Common Causes

1. **Accessing `/api/auth/signup` with GET instead of POST**
   - ❌ Wrong: Visiting `/api/auth/signup` in browser (GET request)
   - ✅ Correct: POST request with username/password in body

2. **Using wrong method for game endpoints**
   - Most game endpoints require POST
   - Check the API.md file for correct methods

### How to Fix

**For Signup:**
Make sure your frontend or API client uses POST:

```javascript
// Correct way to signup
fetch('/api/auth/signup', {
  method: 'POST',  // Must be POST, not GET
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'myusername',
    password: 'mypassword123'
  })
});
```

**For Other Endpoints:**
Refer to [API.md](API.md) for the correct HTTP method for each endpoint.

---

## Error: 401 Unauthorized

### What It Means
You're not logged in or your session has expired.

### Common Causes

1. **Not logged in**
   - You must login before accessing protected endpoints
   - Visit `/login` to authenticate

2. **Session expired**
   - NextAuth sessions expire after inactivity
   - Login again to refresh your session

3. **NEXTAUTH_SECRET changed between deployments**
   - If you change NEXTAUTH_SECRET, all existing sessions are invalidated
   - Users must login again

4. **Cookie issues**
   - Cookies blocked by browser
   - Cross-domain cookie issues

### How to Fix

**Check if you're logged in:**
```javascript
fetch('/api/me')
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.log('Not logged in');
      // Redirect to /login
    } else {
      console.log('Logged in as:', data.username);
    }
  });
```

**Login first:**
1. Visit `/login` page
2. Enter your credentials
3. Try the protected endpoint again

**If you keep getting 401 after login:**
1. Clear your browser cookies for the site
2. Try login in an incognito window
3. Check that NEXTAUTH_URL matches your actual domain
4. Verify NEXTAUTH_SECRET is set in Vercel

---

## Error: 500 Internal Server Error

### What It Means
Something went wrong on the server. This is the most common error and can have many causes.

### Common Causes

1. **Database not connected**
   - DATABASE_URL is wrong or missing
   - Database is not accessible from Vercel
   - Tables not created (migrations not run)

2. **Environment variables missing**
   - NEXTAUTH_SECRET not set
   - BCRYPT_ROUNDS not set

3. **Database tables don't exist**
   - Migrations not run during build
   - Build command doesn't include `prisma migrate deploy`

### How to Fix

**Step 1: Check Health Endpoint**
Visit `/api/health` to see specific errors:
```bash
curl https://your-app.vercel.app/api/health
```

**Step 2: Verify Environment Variables**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Make sure these are set:
- ✅ DATABASE_URL
- ✅ NEXTAUTH_SECRET
- ✅ NEXTAUTH_URL
- ✅ BCRYPT_ROUNDS

**Step 3: Verify Build Command**

Go to Vercel Dashboard → Your Project → Settings → Build & Output

Build Command should be:
```bash
npx prisma migrate deploy && npx prisma generate && npm run build
```

**Step 4: Check Database Connection**

Test your database connection string locally:
```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="your-connection-string"

# Try to connect
npx prisma db execute --stdin <<< "SELECT 1"

# Should print: 1
```

If this fails, your connection string is wrong or your database is not accessible.

**Step 5: Check Vercel Logs**

Go to Vercel Dashboard → Your Project → Logs

Look for specific error messages like:
- "Cannot connect to database"
- "Environment variable not found"
- "Prisma Client not generated"

**Step 6: Redeploy**

After fixing environment variables or build command:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Click "Redeploy"

---

## Error: "Invalid input" on Signup (400 Bad Request)

### What It Means
The data you're sending doesn't meet validation requirements.

### Validation Requirements

**Username:**
- Minimum: 3 characters
- Maximum: 32 characters
- Allowed: Letters (a-z, A-Z), numbers (0-9), and underscore (_)
- Not allowed: Spaces, special characters (!, @, #, etc.)

**Password:**
- Minimum: 8 characters
- Maximum: 128 characters
- Can contain any characters

**PublicTag (optional):**
- Minimum: 1 character (if provided)
- Maximum: 20 characters
- Can be empty string (will be converted to null)

### Common Validation Errors

❌ **Username too short:**
```json
{
  "username": "ab",  // Only 2 chars, need 3+
  "password": "password123"
}
```

❌ **Username has special characters:**
```json
{
  "username": "user@email.com",  // @ not allowed
  "password": "password123"
}
```

❌ **Password too short:**
```json
{
  "username": "validuser",
  "password": "pass"  // Only 4 chars, need 8+
}
```

✅ **Valid request:**
```json
{
  "username": "validuser123",
  "password": "securepass123",
  "publicTag": "Cool Player"
}
```

### How to Fix

**Check your request payload:**
```javascript
const payload = {
  username: 'myusername',      // 3-32 chars, alphanumeric + underscore
  password: 'mypassword123',    // 8-128 chars
  publicTag: 'My Tag'           // Optional, 1-20 chars
};

const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const data = await response.json();
if (data.error) {
  console.log('Validation error:', data.details);
}
```

---

## Error: "Username already in use" (409 Conflict)

### What It Means
Someone else has already registered with that username.

### How to Fix
Choose a different username. Usernames are case-sensitive, so "User" is different from "user".

---

## Error: Prisma P1001 "Can't reach database server"

### What It Means
Your application cannot connect to the PostgreSQL database.

### Common Causes

1. **Wrong connection string**
   - Missing username, password, host, or database name
   - Wrong port (should be 5432 for PostgreSQL)

2. **Database not accessible from internet**
   - Database requires IP whitelisting
   - Database is running locally (not accessible from Vercel)
   - Firewall blocking connections

3. **SSL/TLS required but not specified**
   - Many cloud databases require SSL
   - Add `?sslmode=require` to your connection string

### How to Fix

**Verify Connection String Format:**
```
postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

**For Vercel Postgres:**
Use the POSTGRES_URL provided by Vercel (automatically set)

**For External Database:**
1. Check database is accessible from internet
2. Whitelist Vercel's IP addresses (or use 0.0.0.0/0 to allow all)
3. Enable SSL if required
4. Test connection from local machine first

**Test Connection:**
```bash
# Install psql (PostgreSQL client)
# On Ubuntu/Debian: apt-get install postgresql-client
# On Mac: brew install postgresql

# Test connection
psql "postgresql://user:pass@host:5432/dbname?sslmode=require"
```

---

## Error: Prisma P2021 "Table does not exist"

### What It Means
Database tables haven't been created yet. Migrations haven't run.

### How to Fix

**Step 1: Verify Build Command**

Your Vercel build command MUST include:
```bash
npx prisma migrate deploy && npx prisma generate && npm run build
```

**Step 2: Redeploy**

After updating build command:
1. Go to Vercel Dashboard → Deployments
2. Redeploy the latest deployment
3. Watch the build logs to ensure migrations run

**Step 3: Verify Tables Exist**

Connect to your database and check:
```sql
-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show: User, Session, Account, GemTransaction, etc.
```

---

## Error: "NEXTAUTH_URL" or "NEXTAUTH_SECRET" not set

### What It Means
Required environment variables for authentication are missing.

### How to Fix

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Copy the output and add to Vercel environment variables.

**Set NEXTAUTH_URL:**
- For production: `https://your-app.vercel.app`
- For custom domain: `https://your-custom-domain.com`
- Must include `https://` and match your actual domain

**Add to Vercel:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `NEXTAUTH_SECRET` with your generated value
3. Add `NEXTAUTH_URL` with your domain
4. Select all environments (Production, Preview, Development)
5. Save and redeploy

---

## Error: Build Warnings about Deprecated Packages

### What It Means
Some npm packages are deprecated. These are informational warnings.

### Example Warnings
```
npm warn deprecated inflight@1.0.6
npm warn deprecated glob@7.2.3
npm warn deprecated rimraf@3.0.2
```

### Impact
These warnings don't affect functionality. The app will work fine.

### How to Fix (Optional)
If you want to suppress these warnings:

1. **Update package.json** to use newer versions (risky, may break things)
2. **Ignore the warnings** (recommended for now)
3. **Use npm overrides** to specify newer sub-dependencies:

```json
{
  "overrides": {
    "inflight": "^1.0.6",
    "glob": "^10.0.0"
  }
}
```

---

## Error: "Cannot read properties of undefined" in Frontend

### What It Means
Your frontend is trying to access data that doesn't exist yet.

### Common Causes

1. **API response not loaded yet**
2. **User not logged in**
3. **Missing error handling**

### How to Fix

**Add loading states:**
```javascript
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/me')
    .then(res => res.json())
    .then(data => {
      if (!data.error) {
        setUser(data);
      }
      setLoading(false);
    });
}, []);

if (loading) return <div>Loading...</div>;
if (!user) return <div>Please login</div>;

return <div>Welcome, {user.username}</div>;
```

---

## Still Having Issues?

### Step-by-Step Debug Process

1. **Visit `/api/health`** - Check overall status
2. **Check Vercel Logs** - Look for specific errors
3. **Verify Environment Variables** - Ensure all required vars are set
4. **Test Database Connection** - Use psql or another client
5. **Check Build Logs** - Ensure migrations ran successfully
6. **Clear Cache** - Clear browser cookies and try again
7. **Incognito Mode** - Test in a fresh browser session

### Getting More Help

When asking for help, provide:

1. **Error message** (exact text)
2. **When it happens** (signup, login, playing games, etc.)
3. **Health check response** (`/api/health`)
4. **Vercel build logs** (if applicable)
5. **Browser console errors** (F12 → Console tab)

### Resources

- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [API.md](API.md) - Complete API reference
- [README.md](README.md) - Project overview
- [Vercel Docs](https://vercel.com/docs) - Vercel documentation
- [Prisma Docs](https://www.prisma.io/docs) - Prisma documentation
- [NextAuth Docs](https://next-auth.js.org/) - Authentication docs
