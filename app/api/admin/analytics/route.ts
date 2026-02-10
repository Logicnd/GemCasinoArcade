import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, requireAdmin } from '@/lib/auth/guards';
import { GemTransactionType } from '@prisma/client';

const gamePairs: Record<string, { bet: GemTransactionType; payout: GemTransactionType }> = {
  slots: { bet: GemTransactionType.SLOTS_BET, payout: GemTransactionType.SLOTS_PAYOUT },
  mines: { bet: GemTransactionType.MINES_BET, payout: GemTransactionType.MINES_PAYOUT },
  plinko: { bet: GemTransactionType.PLINKO_BET, payout: GemTransactionType.PLINKO_PAYOUT },
  blackjack: { bet: GemTransactionType.BLACKJACK_BET, payout: GemTransactionType.BLACKJACK_PAYOUT },
  jackpot: { bet: GemTransactionType.JACKPOT_ENTRY, payout: GemTransactionType.JACKPOT_WIN },
};

export async function GET() {
  const session = await requireSession();
  requireAdmin(session);

  const analytics: Record<string, any> = {};
  for (const [key, pair] of Object.entries(gamePairs)) {
    const [bets, payouts] = await Promise.all([
      prisma.gemTransaction.aggregate({
        _sum: { amount: true },
        where: { type: pair.bet },
      }),
      prisma.gemTransaction.aggregate({
        _sum: { amount: true },
        where: { type: pair.payout },
      }),
    ]);
    const betSum = Math.abs(bets._sum.amount ?? 0);
    const payoutSum = payouts._sum.amount ?? 0;
    analytics[key] = {
      betSum,
      payoutSum,
      rtp: betSum === 0 ? null : Number((payoutSum / betSum).toFixed(3)),
    };
  }

  const net = await prisma.gemTransaction.aggregate({ _sum: { amount: true } });

  return NextResponse.json({ ok: true, analytics, netFlow: net._sum.amount ?? 0 });
}
