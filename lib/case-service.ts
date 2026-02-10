import { Prisma, PrismaClient, Rarity, GemTransactionType } from '@prisma/client';
import { randomInt, randomFloat } from './rng-service';
import { recordGemTransaction } from './ledger';
import { prisma as prismaClient } from './prisma';
import { randomUUID } from 'crypto';

type WithTx = PrismaClient | Prisma.TransactionClient;

export function rollRarity(weights: Record<string, number>) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + Number(w), 0);
  let roll = randomFloat('LOOT_RNG') * total;
  for (const [rarity, weight] of entries) {
    if (roll < weight) return rarity as Rarity;
    roll -= weight;
  }
  return entries[entries.length - 1][0] as Rarity;
}

export function pickItem(pool: string[]) {
  if (!pool || pool.length === 0) throw new Error('Empty item pool');
  const idx = randomInt(pool.length, 'LOOT_RNG');
  return pool[idx];
}

export async function openCaseByKey(userId: string, caseKey: string, tx: WithTx = prismaClient) {
  const caseDef = await tx.caseDefinition.findUnique({ where: { key: caseKey } });
  if (!caseDef || !caseDef.enabled) throw new Error('Case unavailable');

  const rarityWeights = caseDef.rarityWeights as Record<string, number>;
  const itemPools = caseDef.itemPools as Record<string, string[]>;

  const rarity = rollRarity(rarityWeights);
  const itemId = pickItem(itemPools[rarity] ?? []);
  const refId = randomUUID();

  await recordGemTransaction(userId, -caseDef.priceGems, GemTransactionType.CASE_OPEN_BET, refId, tx, {
    caseKey,
    rarity,
  });

  await tx.inventory.upsert({
    where: { userId_itemId: { userId, itemId } },
    update: { quantity: { increment: 1 } },
    create: { userId, itemId, quantity: 1 },
  });

  await tx.caseOpenLog.create({
    data: {
      userId,
      caseId: caseDef.id,
      rolledRarity: rarity,
      itemId,
      rngMetadata: { caseKey, rarity },
    },
  });

  await tx.gemTransaction.create({
    data: {
      userId,
      type: GemTransactionType.CASE_OPEN_REWARD,
      amount: 0,
      balanceAfter: (await tx.user.findUnique({ where: { id: userId }, select: { gemsBalance: true } }))?.gemsBalance ?? 0,
      refId,
      metadata: { caseKey, itemId, rarity },
    },
  });

  return { rarity, itemId, refId, price: caseDef.priceGems };
}
