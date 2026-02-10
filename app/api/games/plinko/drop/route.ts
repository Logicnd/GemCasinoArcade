import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/guards';
import { getGameConfig } from '@/lib/config';
import { generatePath, resolvePlinkoMultiplier } from '@/lib/plinko-engine';
import { processBetAndPayout } from '@/lib/ledger';
import { GemTransactionType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  bet: z.number().int().positive(),
  rows: z.number().int().min(4).max(16),
  risk: z.enum(['low', 'medium', 'high']),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = rateLimit(`plinko:${ip}`, 8, 1000);
  if (!rl.allowed) return NextResponse.json({ error: 'Too many drops' }, { status: 429 });

  const session = await requireSession();
  const { bet, rows, risk } = parsed.data;

  const config = await getGameConfig('plinko');
  const cfg = (config.config as any) as import('@/lib/plinko-engine').PlinkoConfig;
  const minBet = cfg?.minBet ?? 10;
  const maxBet = cfg?.maxBet ?? 200;
  if (bet < minBet || bet > maxBet) {
    return NextResponse.json({ error: `Bet must be between ${minBet}-${maxBet}` }, { status: 400 });
  }
  if (!cfg.rows.includes(rows)) {
    return NextResponse.json({ error: `Rows must be one of ${cfg.rows.join(', ')}` }, { status: 400 });
  }

  const path = generatePath(rows);
  const { bucketIndex, multiplier } = resolvePlinkoMultiplier(path, risk, cfg.multipliers);
  const payout = Math.floor(bet * multiplier);
  const refId = randomUUID();

  const balance = await processBetAndPayout({
    userId: session.user!.id,
    bet,
    payout,
    betType: GemTransactionType.PLINKO_BET,
    payoutType: GemTransactionType.PLINKO_PAYOUT,
    refId,
    metadata: { risk, rows, bucketIndex, multiplier, path },
  });

  return NextResponse.json({ ok: true, path, bucketIndex, multiplier, payout, balance, refId });
}
