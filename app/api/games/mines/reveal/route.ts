import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { MINES_GRID_SIZE, revealTile, minesMultiplier } from '@/lib/mines-engine';
import { MinesRoundStatus } from '@prisma/client';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  roundId: z.string().min(1),
  tileIndex: z.number().int().min(0).max(MINES_GRID_SIZE - 1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = rateLimit(`mines:${ip}`, 20, 1000);
  if (!rl.allowed) return NextResponse.json({ error: 'Too many actions' }, { status: 429 });

  const session = await requireSession();
  const { roundId, tileIndex } = parsed.data;

  const round = await prisma.minesRound.findUnique({
    where: { id: roundId },
    select: { userId: true, status: true, bet: true, minesCount: true, state: true },
  });

  if (!round || round.userId !== session.user!.id) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }
  if (round.status !== MinesRoundStatus.ACTIVE) {
    return NextResponse.json({ error: 'Round finished' }, { status: 400 });
  }

  const state = round.state as any;
  const result = revealTile(state, tileIndex);

  if (result.hitMine) {
    await prisma.minesRound.update({
      where: { id: roundId },
      data: { state, status: MinesRoundStatus.LOST },
    });
    return NextResponse.json({ ok: true, lost: true });
  }

  await prisma.minesRound.update({
    where: { id: roundId },
    data: { state },
  });

  const revealedSafe = (state.revealed as number[]).length;
  const multiplier = minesMultiplier(revealedSafe, round.minesCount);
  const potential = Math.floor(round.bet * multiplier);

  return NextResponse.json({
    ok: true,
    lost: false,
    revealedSafe,
    multiplier,
    potentialPayout: potential,
  });
}
