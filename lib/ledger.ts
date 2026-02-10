import { GemTransactionType, Prisma, PrismaClient } from '@prisma/client';
import { prisma as prismaClient } from './prisma';

type WithTx = PrismaClient | Prisma.TransactionClient;

export class LedgerError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function ensureBalance(userId: string, tx: WithTx) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { gemsBalance: true, isBanned: true, settings: true },
  });
  if (!user) throw new LedgerError('User not found', 404);
  if (user.isBanned) throw new LedgerError('User is banned', 403);
  return user;
}

async function enforceSelfLimits(
  userId: string,
  amount: number,
  type: GemTransactionType,
  tx: WithTx,
  settings: any
) {
  const limits = settings?.selfLimits;
  if (!limits) return;

  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

  // Loss limit applies to debits only
  if (amount < 0 && limits.maxLossPerDay) {
    const aggregate = await tx.gemTransaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        createdAt: { gte: startOfDay },
        amount: { lt: 0 },
      },
    });
    const currentLoss = Math.abs(aggregate._sum.amount ?? 0);
    if (currentLoss + Math.abs(amount) > limits.maxLossPerDay) {
      throw new LedgerError('Daily loss limit reached', 403);
    }
  }

  if (amount < 0 && limits.maxPlaysPerDay) {
    const count = await tx.gemTransaction.count({
      where: { userId, createdAt: { gte: startOfDay }, amount: { lt: 0 } },
    });
    if (count >= limits.maxPlaysPerDay) throw new LedgerError('Daily play limit reached', 403);
  }
}

export async function recordGemTransaction(
  userId: string,
  amount: number,
  type: GemTransactionType,
  refId: string,
  tx: WithTx,
  metadata: Record<string, any> = {}
) {
  const user = await ensureBalance(userId, tx);
  await enforceSelfLimits(userId, amount, type, tx, user.settings);

  const nextBalance = user.gemsBalance + amount;
  if (nextBalance < 0) throw new LedgerError('Insufficient gems', 400);

  await tx.user.update({
    where: { id: userId },
    data: { gemsBalance: nextBalance },
  });

  await tx.gemTransaction.create({
    data: {
      userId,
      type,
      amount,
      balanceAfter: nextBalance,
      refId,
      metadata,
    },
  });

  return nextBalance;
}

export async function processBetAndPayout(opts: {
  userId: string;
  bet: number;
  payout: number;
  betType: GemTransactionType;
  payoutType: GemTransactionType;
  refId: string;
  metadata?: Record<string, any>;
}) {
  const { userId, bet, payout, betType, payoutType, refId, metadata = {} } = opts;

  if (bet <= 0) throw new LedgerError('Bet must be positive');
  if (payout < 0) throw new LedgerError('Payout cannot be negative');

  return prismaClient.$transaction(async (tx) => {
    await recordGemTransaction(userId, -bet, betType, refId, tx, { ...metadata, stage: 'bet' });
    const finalBalance = await recordGemTransaction(userId, payout, payoutType, refId, tx, {
      ...metadata,
      stage: 'payout',
    });
    return finalBalance;
  });
}
