import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/guards';
import { getGameConfig } from '@/lib/config';
import { generateBombs, MINES_GRID_SIZE } from '@/lib/mines-engine';
import { prisma } from '@/lib/prisma';
import { GemTransactionType, MinesRoundStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { recordGemTransaction } from '@/lib/ledger';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  bet: z.number().int().positive(),
  minesCount: z.number().int().min(1).max(24),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = rateLimit(`mines-start:${ip}`, 5, 1000);
  if (!rl.allowed) return NextResponse.json({ error: 'Too many starts' }, { status: 429 });

  const session = await requireSession();
  const { bet, minesCount } = parsed.data;

  const config = await getGameConfig('mines');
  const { minBet, maxBet, minMines, maxMines } = (config.config as any) ?? {
    minBet: 10,
    maxBet: 200,
    minMines: 3,
    maxMines: 15,
  };
  if (bet < minBet || bet > maxBet) {
    return NextResponse.json({ error: `Bet must be between ${minBet} and ${maxBet}` }, { status: 400 });
  }
  if (minesCount < minMines || minesCount > maxMines) {
    return NextResponse.json({ error: `Mines must be between ${minMines}-${maxMines}` }, { status: 400 });
  }

  const refId = randomUUID();
  const bombs = generateBombs(minesCount, MINES_GRID_SIZE);

  const result = await prisma.$transaction(async (tx) => {
    await recordGemTransaction(session.user!.id, -bet, GemTransactionType.MINES_BET, refId, tx, {
      minesCount,
    });

    const round = await tx.minesRound.create({
      data: {
        userId: session.user!.id,
        bet,
        minesCount,
        state: { bombs, revealed: [], refId },
        status: MinesRoundStatus.ACTIVE,
      },
      select: { id: true },
    });

    const balance = await tx.user.findUnique({ where: { id: session.user!.id }, select: { gemsBalance: true } });
    return { roundId: round.id, balance: balance?.gemsBalance ?? 0 };
  });

  return NextResponse.json({ ok: true, roundId: result.roundId, balance: result.balance });
}
