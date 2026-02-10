# API Reference

Complete reference for all API endpoints in Gem Casino Arcade.

## Authentication

### POST /api/auth/signup

Create a new user account.

**Request Body:**
```json
{
  "username": "string (3-32 chars, alphanumeric + underscore)",
  "password": "string (8-128 chars)",
  "publicTag": "string (optional, 1-20 chars)"
}
```

**Response (Success - 200):**
```json
{
  "ok": true,
  "userId": "string",
  "roles": ["USER"]
}
```

**Response (Error - 400):**
```json
{
  "error": "Invalid input",
  "details": { /* zod validation errors */ }
}
```

**Response (Error - 409):**
```json
{
  "error": "Username already in use"
}
```

**Response (Error - 500):**
```json
{
  "error": "Signup failed"
}
```

**Notes:**
- First user automatically gets OWNER and ADMIN roles
- All users start with 1000 gems balance
- Username must be unique (case-sensitive)

---

### GET/POST /api/auth/[...nextauth]

NextAuth.js authentication endpoints. Handles login, logout, session management.

**For Login:**
- Navigate to `/login` page (handled by NextAuth)
- Or use credentials provider directly

**Session Check:**
```javascript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

const session = await getServerSession(authOptions);
```

---

## User Information

### GET /api/me

Get current user's information including balance and equipped items.

**Authentication:** Required

**Response (Success - 200):**
```json
{
  "id": "string",
  "username": "string",
  "roles": ["USER"],
  "gemsBalance": 1000,
  "shardsBalance": 0,
  "publicTag": "string or null",
  "equippedTitleId": "string or null",
  "equippedTitle": { /* title object */ },
  "isBanned": false,
  "settings": {
    "sound": true,
    "reducedMotion": false,
    "remindersEnabled": false,
    "selfLimits": null
  }
}
```

**Response (Error - 401):**
```json
{
  "error": "Unauthorized"
}
```

---

### GET /api/inventory

Get current user's inventory (owned cosmetic items).

**Authentication:** Required

**Response (Success - 200):**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "rarity": "COMMON | UNCOMMON | RARE | EPIC | LEGENDARY",
      "type": "TITLE | AVATAR | FRAME | THEME | REEL_SKIN | EMOTE",
      "createdAt": "timestamp"
    }
  ]
}
```

---

## Economy

### POST /api/economy/daily-claim

Claim daily bonus gems and increment streak.

**Authentication:** Required

**Request Body:** None

**Response (Success - 200):**
```json
{
  "ok": true,
  "gemsAwarded": 100,
  "newBalance": 1100,
  "streak": 1,
  "nextClaimAt": "timestamp"
}
```

**Response (Error - 400):**
```json
{
  "error": "Daily claim not available yet"
}
```

**Response (Error - 403):**
```json
{
  "error": "Cannot claim daily bonus while banned"
}
```

---

## Games

### POST /api/games/slots/spin

Play a slots spin.

**Authentication:** Required

**Request Body:**
```json
{
  "bet": 10
}
```

**Response (Success - 200):**
```json
{
  "reels": [[0, 1, 2], [3, 4, 5], [6, 7, 8]],
  "payout": 0,
  "lines": [],
  "newBalance": 990,
  "bet": 10
}
```

---

### POST /api/games/mines/start

Start a new Mines game.

**Authentication:** Required

**Request Body:**
```json
{
  "bet": 10,
  "minesCount": 3
}
```

**Response (Success - 200):**
```json
{
  "roundId": "string",
  "bet": 10,
  "minesCount": 3,
  "revealed": [],
  "status": "ACTIVE",
  "multiplier": 1.0,
  "newBalance": 990
}
```

---

### POST /api/games/mines/reveal

Reveal a tile in active Mines game.

**Authentication:** Required

**Request Body:**
```json
{
  "roundId": "string",
  "index": 0
}
```

**Response (Success - 200):**
```json
{
  "hit": "GEM | MINE",
  "revealed": [0, 1, 2],
  "multiplier": 1.5,
  "status": "ACTIVE | LOST",
  "payout": 0,
  "newBalance": 990
}
```

---

### POST /api/games/mines/cashout

Cash out from active Mines game.

**Authentication:** Required

**Request Body:**
```json
{
  "roundId": "string"
}
```

**Response (Success - 200):**
```json
{
  "payout": 15,
  "newBalance": 1005,
  "multiplier": 1.5
}
```

---

### POST /api/games/plinko/drop

Drop a ball in Plinko.

**Authentication:** Required

**Request Body:**
```json
{
  "bet": 10
}
```

**Response (Success - 200):**
```json
{
  "path": [0, 1, 1, 0, 1, 0, 1, 1],
  "bucket": 5,
  "multiplier": 2.0,
  "payout": 20,
  "newBalance": 1010
}
```

---

### POST /api/games/blackjack/start

Start a new Blackjack game.

**Authentication:** Required

**Request Body:**
```json
{
  "bet": 10
}
```

**Response (Success - 200):**
```json
{
  "sessionId": "string",
  "playerCards": [{"rank": "A", "suit": "hearts"}, {"rank": "K", "suit": "spades"}],
  "dealerCards": [{"rank": "7", "suit": "diamonds"}],
  "playerValue": 21,
  "status": "ACTIVE | BLACKJACK | SETTLED",
  "bet": 10,
  "newBalance": 990
}
```

---

### POST /api/games/blackjack/hit

Hit (draw a card) in Blackjack.

**Authentication:** Required

**Request Body:**
```json
{
  "sessionId": "string"
}
```

**Response (Success - 200):**
```json
{
  "playerCards": [/* all cards */],
  "dealerCards": [/* dealer cards */],
  "playerValue": 19,
  "dealerValue": 17,
  "status": "ACTIVE | BUST | SETTLED",
  "payout": 0,
  "newBalance": 990
}
```

---

### POST /api/games/blackjack/stand

Stand (end turn) in Blackjack.

**Authentication:** Required

**Request Body:**
```json
{
  "sessionId": "string"
}
```

**Response:** Similar to /hit, dealer plays out their hand

---

### POST /api/games/blackjack/double

Double down in Blackjack.

**Authentication:** Required

**Request Body:**
```json
{
  "sessionId": "string"
}
```

**Response:** Similar to /hit, with doubled bet

---

### GET /api/games/jackpot/current-round

Get current jackpot round information.

**Authentication:** Optional

**Response (Success - 200):**
```json
{
  "id": "string",
  "totalPool": 1000,
  "entries": [
    {
      "username": "player1",
      "contribution": 100,
      "ticketCount": 10
    }
  ],
  "status": "OPEN | DRAWING | SETTLED",
  "drawsAt": "timestamp"
}
```

---

### POST /api/games/jackpot/enter

Enter the current jackpot round.

**Authentication:** Required

**Request Body:**
```json
{
  "amount": 100
}
```

**Response (Success - 200):**
```json
{
  "ok": true,
  "ticketCount": 10,
  "totalPool": 1100,
  "newBalance": 900
}
```

---

## Cases (Loot Boxes)

### POST /api/cases/open

Open a case to get random items.

**Authentication:** Required

**Request Body:**
```json
{
  "caseId": "string"
}
```

**Response (Success - 200):**
```json
{
  "item": {
    "id": "string",
    "name": "Cool Title",
    "rarity": "RARE",
    "type": "TITLE"
  },
  "cost": 50,
  "newBalance": 950,
  "isDuplicate": false
}
```

---

## Settings

### POST /api/settings/update

Update user settings.

**Authentication:** Required

**Request Body:**
```json
{
  "sound": true,
  "reducedMotion": false,
  "remindersEnabled": false,
  "selfLimits": {
    "maxLossPerDay": 1000,
    "maxPlaysPerDay": 100
  },
  "equippedTitleId": "string or null"
}
```

**Response (Success - 200):**
```json
{
  "ok": true
}
```

---

## Admin Endpoints

Require `ADMIN` or `OWNER` role.

### GET /api/admin/analytics

Get game analytics and statistics.

**Authentication:** Required (ADMIN role)

**Response (Success - 200):**
```json
{
  "totalUsers": 100,
  "activeUsers": 50,
  "gameStats": {
    "slots": { "plays": 1000, "rtp": 0.95 },
    "mines": { "plays": 500, "rtp": 0.97 }
  },
  "economyStats": {
    "totalGemsInCirculation": 100000,
    "gemsSpentToday": 5000
  }
}
```

---

### GET /api/admin/transactions

Get gem transaction history.

**Authentication:** Required (ADMIN role)

**Query Parameters:**
- `userId` (optional): Filter by user
- `limit` (optional): Number of results (default: 50)

**Response (Success - 200):**
```json
{
  "transactions": [
    {
      "id": "string",
      "userId": "string",
      "type": "BET | PAYOUT | DAILY_BONUS | ADMIN_ADJUSTMENT",
      "amount": -10,
      "balanceBefore": 1000,
      "balanceAfter": 990,
      "createdAt": "timestamp"
    }
  ]
}
```

---

### GET /api/admin/audit

Get audit log of admin actions.

**Authentication:** Required (ADMIN role)

**Response (Success - 200):**
```json
{
  "logs": [
    {
      "id": "string",
      "userId": "string",
      "action": "BAN_USER | ADJUST_GEMS | etc",
      "targetUserId": "string",
      "metadata": {},
      "createdAt": "timestamp"
    }
  ]
}
```

---

### POST /api/admin/users/modify

Modify user account (ban, adjust gems, etc.).

**Authentication:** Required (ADMIN role)

**Request Body:**
```json
{
  "targetUserId": "string",
  "action": "BAN | UNBAN | ADJUST_GEMS",
  "gemsAmount": 1000,
  "reason": "string"
}
```

**Response (Success - 200):**
```json
{
  "ok": true
}
```

---

### GET /api/admin/games

Get current game configuration.

**Authentication:** Required (ADMIN role)

**Response (Success - 200):**
```json
{
  "slots": {
    "minBet": 1,
    "maxBet": 1000,
    "enabled": true
  },
  "mines": {
    "minBet": 1,
    "maxBet": 1000,
    "minMines": 1,
    "maxMines": 24,
    "enabled": true
  }
}
```

---

### POST /api/admin/games

Update game configuration.

**Authentication:** Required (ADMIN role)

**Request Body:**
```json
{
  "game": "slots",
  "config": {
    "minBet": 1,
    "maxBet": 1000,
    "enabled": true
  }
}
```

---

## Owner Endpoints

Require `OWNER` role.

### POST /api/owner/roles

Promote or demote user roles.

**Authentication:** Required (OWNER role)

**Request Body:**
```json
{
  "targetUserId": "string",
  "action": "PROMOTE | DEMOTE",
  "role": "ADMIN"
}
```

**Response (Success - 200):**
```json
{
  "ok": true,
  "newRoles": ["USER", "ADMIN"]
}
```

---

### GET /api/owner/site-config

Get site configuration.

**Authentication:** Required (OWNER role)

**Response (Success - 200):**
```json
{
  "maintenanceMode": false,
  "registrationEnabled": true,
  "dailyBonusAmount": 100,
  "dailyBonusStreak": true
}
```

---

### POST /api/owner/site-config

Update site configuration.

**Authentication:** Required (OWNER role)

**Request Body:**
```json
{
  "maintenanceMode": false,
  "registrationEnabled": true,
  "dailyBonusAmount": 100
}
```

---

## RNG (Server-Side Random)

### POST /api/rng/slots

Generate random slots result (for client-side display only).

**Authentication:** Optional

**Response (Success - 200):**
```json
{
  "reels": [[0, 1, 2], [3, 4, 5], [6, 7, 8]],
  "seed": "string"
}
```

**Note:** This does not affect user balance. Use `/api/games/slots/spin` for real gameplay.

---

## Error Responses

All endpoints may return these common errors:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Cause:** Not logged in or session expired

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```
**Cause:** Logged in but lacks required role

### 405 Method Not Allowed
```json
{
  "error": "Method not allowed"
}
```
**Cause:** Using wrong HTTP method (e.g., GET instead of POST)

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```
**Cause:** Server-side error, check logs

---

## Rate Limiting

Some endpoints have rate limiting to prevent abuse:

- **Game endpoints:** Limited to prevent rapid betting
- **Daily claim:** Once per 24 hours
- **Case opening:** Limited based on user's gem balance

Rate limit responses return:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## Frontend Integration Example

```typescript
// Signup
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'myusername',
    password: 'mypassword123'
  })
});
const data = await response.json();

// Get current user
const userResponse = await fetch('/api/me');
const user = await userResponse.json();

// Play slots
const gameResponse = await fetch('/api/games/slots/spin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bet: 10 })
});
const result = await gameResponse.json();
```

---

## WebSocket Support

Currently not implemented. All game actions use REST API with polling for updates.

Future enhancement: Add WebSocket support for real-time updates in multiplayer games like Jackpot.

---

For implementation details, see the source code in `app/api/`.
