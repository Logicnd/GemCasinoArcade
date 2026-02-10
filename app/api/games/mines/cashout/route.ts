import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { minesMultiplier } from '@/lib/mines-engine';
import { GemTransactionType, MinesRoundStatus } from '@prisma/client';
import { recordGemTransaction } from '@/lib/ledger';

const schema = z.object({
  roundId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const session = await requireSession();
  const { roundId } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const round = await tx.minesRound.findUnique({
      where: { id: roundId },
      select: { userId: true, status: true, bet: true, minesCount: true, state: true },
    });
    if (!round || round.userId !== session.user!.id) throw new Error('Round not found');
    if (round.status !== MinesRoundStatus.ACTIVE) throw new Error('Round already settled');

    const state = round.state as any;
    const revealedSafe = (state.revealed as number[]).length;
    const multiplier = minesMultiplier(revealedSafe, round.minesCount);
    const payout = Math.floor(round.bet * multiplier);
    const refId = state.refId ?? roundId;

    await tx.minesRound.update({
      where: { id: roundId },
      data: { status: MinesRoundStatus.CASHED },
    });

    const balance = await recordGemTransaction(
      session.user!.id,
      payout,
      GemTransactionType.MINES_PAYOUT,
      refId,
      tx,
      { revealedSafe, multiplier }
    );

    return { payout, multiplier, balance, revealedSafe };
  });

  return NextResponse.json({ ok: true, ...result });
}
