import { GameConfig, Prisma, PrismaClient, SiteConfig } from '@prisma/client';
import { prisma as prismaClient } from './prisma';
import { randomUUID } from 'crypto';

type WithTx = PrismaClient | Prisma.TransactionClient;

function runTransaction<T>(tx: WithTx, fn: (trx: Prisma.TransactionClient) => Promise<T>) {
  if (typeof (tx as PrismaClient).$transaction === 'function') {
    return (tx as PrismaClient).$transaction(fn);
  }
  return prismaClient.$transaction(fn);
}

export async function getSiteConfig(tx: WithTx = prismaClient): Promise<SiteConfig> {
  const config = await tx.siteConfig.findUnique({ where: { id: 1 } });
  if (!config) {
    return tx.siteConfig.create({
      data: {
        id: 1,
        maintenanceMode: false,
        maintenanceMessage: '',
        dailyBonusBase: 250,
        streakBonus: 25,
        streakCap: 250,
        disclaimer: 'Entertainment only. Virtual gems only. No real money. No prizes. No cash-out.',
        version: 1,
      },
    });
  }
  return config;
}

export async function updateSiteConfig(
  data: Partial<Omit<SiteConfig, 'id' | 'updatedAt'>>,
  userId: string,
  tx: WithTx = prismaClient
) {
  return runTransaction(tx, async (trx) => {
    const current = await getSiteConfig(trx);
    await trx.siteConfigHistory.create({
      data: { ...current, id: randomUUID(), updatedByUserId: current.updatedByUserId },
    });
    const next = await trx.siteConfig.update({
      where: { id: 1 },
      data: { ...data, version: current.version + 1, updatedByUserId: userId },
    });
    return next;
  });
}

export async function getGameConfig(key: string, tx: WithTx = prismaClient): Promise<GameConfig> {
  const cfg = await tx.gameConfig.findUnique({ where: { key } });
  if (!cfg) {
    throw new Error(`Missing config for game ${key}`);
  }
  return cfg;
}

export async function updateGameConfig(
  key: string,
  data: { config?: any; enabled?: boolean },
  userId: string,
  tx: WithTx = prismaClient
) {
  return runTransaction(tx, async (trx) => {
    const current = await getGameConfig(key, trx);
    await trx.gameConfigHistory.create({
      data: {
        key: current.key,
        enabled: current.enabled,
        config: current.config as unknown as Prisma.InputJsonValue,
        version: current.version,
        updatedAt: current.updatedAt,
        updatedByUserId: current.updatedByUserId,
      },
    });
    const next = await trx.gameConfig.update({
      where: { key },
      data: {
        config: (data.config ?? current.config) as unknown as Prisma.InputJsonValue,
        enabled: typeof data.enabled === 'boolean' ? data.enabled : current.enabled,
        version: current.version + 1,
        updatedByUserId: userId,
        updatedAt: new Date(),
      },
    });
    return next;
  });
}
