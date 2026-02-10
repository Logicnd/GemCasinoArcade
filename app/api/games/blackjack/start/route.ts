import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/guards';
import { getGameConfig } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { startBlackjack, settle } from '@/lib/blackjack-engine';
import { GemTransactionType, BlackjackStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { recordGemTransaction } from '@/lib/ledger';

const schema = z.object({
  bet: z.number().int().positive(),
});

function sanitizeState(state: any) {
  return {
    player: state.player,
    dealer: [state.dealer[0], null],
    status: state.status,
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const session = await requireSession();
  const { bet } = parsed.data;
  const config = await getGameConfig('blackjack');
  const cfg = config.config as any;
  const minBet = cfg?.minBet ?? 10;
  const maxBet = cfg?.maxBet ?? 200;
  if (bet < minBet || bet > maxBet) {
    return NextResponse.json({ error: `Bet must be between ${minBet}-${maxBet}` }, { status: 400 });
  }

  const refId = randomUUID();
  const balance = await prisma.$transaction(async (tx) => {
    await recordGemTransaction(session.user!.id, -bet, GemTransactionType.BLACKJACK_BET, refId, tx, {});
    const state = startBlackjack() as any;

    let status: BlackjackStatus = BlackjackStatus.ACTIVE;
    let payout = 0;
    if (state.status === 'BLACKJACK') {
      status = BlackjackStatus.PLAYER_WIN;
      payout = Math.floor(bet * (cfg?.blackjackPayout ?? 1.5) + bet);
      await recordGemTransaction(session.user!.id, payout, GemTransactionType.BLACKJACK_PAYOUT, refId, tx, {
        reason: 'blackjack',
      });
    }

    await tx.blackjackSession.create({
      data: {
        id: refId,
        userId: session.user!.id,
        bet,
        state: { ...state, status } as unknown as Prisma.InputJsonValue,
        status,
      },
    });

    const bal = await tx.user.findUnique({ where: { id: session.user!.id }, select: { gemsBalance: true } });
    return { balance: bal?.gemsBalance ?? 0, state };
  });

  return NextResponse.json({ ok: true, sessionId: refId, state: sanitizeState(balance.state), balance: balance.balance });
}
