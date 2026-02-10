import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { stand as bjStand, settle } from '@/lib/blackjack-engine';
import { GemTransactionType, BlackjackStatus } from '@prisma/client';
import { recordGemTransaction } from '@/lib/ledger';

const schema = z.object({
  sessionId: z.string().min(1),
});

function sanitize(state: any) {
  return { player: state.player, dealer: state.dealer, status: state.status };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const session = await requireSession();
  const { sessionId } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const game = await tx.blackjackSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, state: true, bet: true, status: true },
    });
    if (!game || game.userId !== session.user!.id) throw new Error('Session not found');
    if (game.status !== BlackjackStatus.ACTIVE) throw new Error('Session finished');

    const state = bjStand(game.state as any);
    const payout = settle(state as any, game.bet);
    let balance: number | null = null;
    if (payout > 0) {
      balance = await recordGemTransaction(
        session.user!.id,
        payout,
        GemTransactionType.BLACKJACK_PAYOUT,
        sessionId,
        tx,
        { status: state.status }
      );
    }

    await tx.blackjackSession.update({
      where: { id: sessionId },
      data: { state, status: state.status as BlackjackStatus },
    });

    return { state, payout, balance };
  });

  return NextResponse.json({ ok: true, state: sanitize(result.state), payout: result.payout, balance: result.balance });
}
