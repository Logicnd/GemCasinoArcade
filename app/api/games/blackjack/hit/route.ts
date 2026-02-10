import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { hit as bjHit, handValue } from '@/lib/blackjack-engine';
import { BlackjackStatus } from '@prisma/client';

const schema = z.object({
  sessionId: z.string().min(1),
});

function sanitize(state: any) {
  return { player: state.player, dealer: [state.dealer[0], null], status: state.status };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const session = await requireSession();
  const { sessionId } = parsed.data;

  const game = await prisma.blackjackSession.findUnique({
    where: { id: sessionId },
    select: { userId: true, state: true, status: true },
  });
  if (!game || game.userId !== session.user!.id) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (game.status !== BlackjackStatus.ACTIVE) return NextResponse.json({ error: 'Session finished' }, { status: 400 });

  const state = game.state as any;
  bjHit(state, 'player');
  const playerValue = handValue(state.player).total;
  let status: BlackjackStatus = BlackjackStatus.ACTIVE;
  if (playerValue > 21) status = BlackjackStatus.PLAYER_BUST;

  state.status = status;

  await prisma.blackjackSession.update({
    where: { id: sessionId },
    data: { state, status },
  });

  return NextResponse.json({ ok: true, state: sanitize({ ...state, status }) });
}
