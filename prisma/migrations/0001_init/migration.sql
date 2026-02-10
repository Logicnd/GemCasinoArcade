-- Prisma-like manual migration for Phase 2 schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'USER');
CREATE TYPE "GemTransactionType" AS ENUM (
  'DAILY_BONUS','SLOTS_BET','SLOTS_PAYOUT','MINES_BET','MINES_PAYOUT','PLINKO_BET','PLINKO_PAYOUT','BLACKJACK_BET','BLACKJACK_PAYOUT','JACKPOT_ENTRY','JACKPOT_WIN','ADMIN_ADJUST','CASE_OPEN_BET','CASE_OPEN_REWARD'
);
CREATE TYPE "Rarity" AS ENUM ('COMMON','UNCOMMON','RARE','EPIC','LEGENDARY','MYTHICAL','DIVINE','SECRET');
CREATE TYPE "ItemType" AS ENUM ('TITLE','AVATAR','FRAME','THEME','REEL_SKIN','EMOTE');
CREATE TYPE "MinesRoundStatus" AS ENUM ('ACTIVE','CASHED','LOST');
CREATE TYPE "BlackjackStatus" AS ENUM ('ACTIVE','PLAYER_BUST','DEALER_BUST','PLAYER_WIN','DEALER_WIN','PUSH','CASHED');
CREATE TYPE "JackpotStatus" AS ENUM ('OPEN','CLOSED','SETTLED');

-- Tables
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "email" TEXT,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "passwordHash" TEXT NOT NULL,
  "roles" "Role"[] NOT NULL,
  "gemsBalance" INTEGER NOT NULL DEFAULT 1000,
  "shardsBalance" INTEGER NOT NULL DEFAULT 0,
  "ageGateAcceptedAt" TIMESTAMP(3),
  "settings" JSONB,
  "publicTag" TEXT,
  "equippedTitleId" TEXT,
  "isBanned" BOOLEAN NOT NULL DEFAULT FALSE,
  "banReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Account" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider","providerAccountId")
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier","token")
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" TEXT REFERENCES "User"("id"),
  "targetUserId" TEXT REFERENCES "User"("id"),
  "actionType" TEXT NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog" ("actorUserId");
CREATE INDEX "AuditLog_targetUserId_idx" ON "AuditLog" ("targetUserId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");

CREATE TABLE "GemTransaction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" "GemTransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "refId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX "GemTransaction_user_createdAt_idx" ON "GemTransaction" ("userId","createdAt");
CREATE INDEX "GemTransaction_refId_idx" ON "GemTransaction" ("refId");

CREATE TABLE "GameConfig" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL UNIQUE,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "config" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedByUserId" TEXT REFERENCES "User"("id")
);

CREATE TABLE "GameConfigHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "config" JSONB NOT NULL,
  "version" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedByUserId" TEXT REFERENCES "User"("id"),
  CONSTRAINT "GameConfigHistory_key_version_key" UNIQUE ("key","version")
);
CREATE INDEX "GameConfigHistory_key_idx" ON "GameConfigHistory" ("key");

CREATE TABLE "SiteConfig" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "maintenanceMode" BOOLEAN NOT NULL DEFAULT FALSE,
  "maintenanceMessage" TEXT NOT NULL DEFAULT '',
  "dailyBonusBase" INTEGER NOT NULL DEFAULT 250,
  "streakBonus" INTEGER NOT NULL DEFAULT 25,
  "streakCap" INTEGER NOT NULL DEFAULT 250,
  "disclaimer" TEXT NOT NULL DEFAULT 'Entertainment only. Virtual gems only. No real money. No prizes. No cash-out.',
  "version" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedByUserId" TEXT REFERENCES "User"("id")
);

CREATE TABLE "SiteConfigHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "maintenanceMode" BOOLEAN NOT NULL,
  "maintenanceMessage" TEXT NOT NULL,
  "dailyBonusBase" INTEGER NOT NULL,
  "streakBonus" INTEGER NOT NULL,
  "streakCap" INTEGER NOT NULL,
  "disclaimer" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedByUserId" TEXT REFERENCES "User"("id")
);

CREATE TABLE "Item" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "rarity" "Rarity" NOT NULL,
  "type" "ItemType" NOT NULL,
  "assetKey" TEXT NOT NULL UNIQUE,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE "CaseDefinition" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "priceGems" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "rarityWeights" JSONB NOT NULL,
  "itemPools" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedByUserId" TEXT REFERENCES "User"("id")
);

CREATE TABLE "CaseDefinitionHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceGems" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "rarityWeights" JSONB NOT NULL,
  "itemPools" JSONB NOT NULL,
  "version" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedByUserId" TEXT REFERENCES "User"("id"),
  CONSTRAINT "CaseDefinitionHistory_key_version_key" UNIQUE ("key","version")
);
CREATE INDEX "CaseDefinitionHistory_key_idx" ON "CaseDefinitionHistory" ("key");

CREATE TABLE "Inventory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "itemId" TEXT NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "Inventory_user_item_unique" UNIQUE ("userId","itemId")
);
CREATE INDEX "Inventory_user_idx" ON "Inventory" ("userId");

CREATE TABLE "CaseOpenLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "caseId" TEXT NOT NULL REFERENCES "CaseDefinition"("id"),
  "rolledRarity" "Rarity" NOT NULL,
  "itemId" TEXT NOT NULL REFERENCES "Item"("id"),
  "rngMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX "CaseOpenLog_user_created_idx" ON "CaseOpenLog" ("userId","createdAt");

CREATE TABLE "MinesRound" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "bet" INTEGER NOT NULL,
  "minesCount" INTEGER NOT NULL,
  "state" JSONB NOT NULL,
  "status" "MinesRoundStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX "MinesRound_user_status_idx" ON "MinesRound" ("userId","status");

CREATE TABLE "BlackjackSession" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "bet" INTEGER NOT NULL,
  "state" JSONB NOT NULL,
  "status" "BlackjackStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX "BlackjackSession_user_status_idx" ON "BlackjackSession" ("userId","status");

CREATE TABLE "JackpotRound" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "status" "JackpotStatus" NOT NULL DEFAULT 'OPEN',
  "endsAt" TIMESTAMP(3) NOT NULL,
  "pot" INTEGER NOT NULL DEFAULT 0,
  "seed" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "winnerUserId" TEXT REFERENCES "User"("id")
);
CREATE INDEX "JackpotRound_status_idx" ON "JackpotRound" ("status");

CREATE TABLE "JackpotEntry" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "roundId" TEXT NOT NULL REFERENCES "JackpotRound"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "amount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX "JackpotEntry_round_idx" ON "JackpotEntry" ("roundId");
CREATE INDEX "JackpotEntry_user_idx" ON "JackpotEntry" ("userId");

-- Equipped title FK
ALTER TABLE "User" ADD CONSTRAINT "User_equippedTitleId_fkey" FOREIGN KEY ("equippedTitleId") REFERENCES "Item"("id");
