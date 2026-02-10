import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/guards';
import { calculateSpinResult } from '@/lib/slots-engine';
import { processBetAndPayout } from '@/lib/ledger';
import { GemTransactionType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { getGameConfig } from '@/lib/config';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  bet: z.number().int().positive(),
  clientSeed: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = rateLimit(`slots:${ip}`, 10, 1000);
  if (!rl.allowed) return NextResponse.json({ error: 'Too many spins' }, { status: 429 });

  const session = await requireSession();
  const { bet, clientSeed } = parsed.data;

  const config = await getGameConfig('slots');
  const { minBet, maxBet } = (config.config as any) ?? { minBet: 10, maxBet: 200 };
  if (bet < minBet || bet > maxBet) {
    return NextResponse.json({ error: `Bet must be between ${minBet} and ${maxBet}` }, { status: 400 });
  }

  const spin = calculateSpinResult(bet, clientSeed);
  const refId = randomUUID();

  const finalBalance = await processBetAndPayout({
    userId: session.user!.id,
    bet,
    payout: spin.payout,
    betType: GemTransactionType.SLOTS_BET,
    payoutType: GemTransactionType.SLOTS_PAYOUT,
    refId,
    metadata: { winLines: spin.winLines, isWin: spin.isWin },
  });

  return NextResponse.json({ ok: true, result: spin, balance: finalBalance, refId });
}
