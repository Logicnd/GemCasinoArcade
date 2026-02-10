import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/guards';
import { getGameConfig } from '@/lib/config';
import { getOpenRound, settleRound } from '@/lib/jackpot-service';
import { prisma } from '@/lib/prisma';
import { GemTransactionType, JackpotStatus } from '@prisma/client';
import { recordGemTransaction } from '@/lib/ledger';

const schema = z.object({
  amount: z.number().int().positive(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const session = await requireSession();
  const { amount } = parsed.data;
  const cfg = (await getGameConfig('jackpot')).config as any;
  const minEntry = cfg?.minEntry ?? 50;
  if (amount < minEntry) {
    return NextResponse.json({ error: `Minimum entry is ${minEntry}` }, { status: 400 });
  }

  let round = await getOpenRound();
  if (round.endsAt < new Date()) {
    await settleRound(round.id);
    round = await getOpenRound();
  }

  const result = await prisma.$transaction(async (tx) => {
    const roundFresh = await tx.jackpotRound.findUnique({ where: { id: round.id }, select: { id: true, status: true } });
    if (!roundFresh || roundFresh.status !== JackpotStatus.OPEN) throw new Error('Round closed');

    await recordGemTransaction(session.user!.id, -amount, GemTransactionType.JACKPOT_ENTRY, round.id, tx, {});

    await tx.jackpotEntry.create({
      data: { roundId: round.id, userId: session.user!.id, amount },
    });

    await tx.jackpotRound.update({
      where: { id: round.id },
      data: { pot: { increment: amount } },
    });

    const bal = await tx.user.findUnique({ where: { id: session.user!.id }, select: { gemsBalance: true } });
    return { balance: bal?.gemsBalance ?? 0 };
  });

  return NextResponse.json({ ok: true, roundId: round.id, balance: result.balance });
}
