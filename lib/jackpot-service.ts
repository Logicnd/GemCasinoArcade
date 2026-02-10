import { GemTransactionType, JackpotStatus, Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { randomInt } from './rng-service';
import { recordGemTransaction } from './ledger';
import { getGameConfig } from './config';
import { prisma as prismaClient } from './prisma';

type WithTx = PrismaClient | Prisma.TransactionClient;

async function createRound(tx: WithTx) {
  const cfg = (await getGameConfig('jackpot', tx as any)).config as any;
  const duration = cfg?.roundDurationSeconds ?? 300;
  const seed = randomUUID();
  const endsAt = new Date(Date.now() + duration * 1000);
  return tx.jackpotRound.create({
    data: {
      endsAt,
      pot: 0,
      seed,
      status: JackpotStatus.OPEN,
    },
  });
}

export async function getOpenRound(tx: WithTx = prismaClient) {
  let round = await tx.jackpotRound.findFirst({ where: { status: JackpotStatus.OPEN }, orderBy: { createdAt: 'desc' } });
  if (!round) round = await createRound(tx);
  return round;
}

export async function settleRound(roundId: string, tx: WithTx = prismaClient) {
  const round = await tx.jackpotRound.findUnique({
    where: { id: roundId },
    include: { entries: true },
  });
  if (!round || round.status !== JackpotStatus.OPEN) return null;
  if (round.entries.length === 0) {
    return tx.jackpotRound.update({ where: { id: roundId }, data: { status: JackpotStatus.CLOSED } });
  }

  const cfg = (await getGameConfig('jackpot', tx as any)).config as any;
  const cutBps = cfg?.houseCutBps ?? 250;
  const tickets: { userId: string; weight: number }[] = [];
  for (const e of round.entries) tickets.push({ userId: e.userId, weight: e.amount });

  const totalWeight = tickets.reduce((s, t) => s + t.weight, 0);
  let roll = randomInt(totalWeight, 'JACKPOT_RNG');
  let winnerUserId = tickets[0].userId;
  for (const t of tickets) {
    if (roll < t.weight) {
      winnerUserId = t.userId;
      break;
    }
    roll -= t.weight;
  }

  const potAfterCut = Math.floor(round.pot * (1 - cutBps / 10000));
  await recordGemTransaction(
    winnerUserId,
    potAfterCut,
    GemTransactionType.JACKPOT_WIN,
    round.id,
    tx,
    { pot: round.pot, cutBps }
  );

  return tx.jackpotRound.update({
    where: { id: roundId },
    data: { status: JackpotStatus.SETTLED, winnerUserId },
  });
}
