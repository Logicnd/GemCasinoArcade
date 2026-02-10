import { NextResponse } from 'next/server';
import { getOpenRound, settleRound } from '@/lib/jackpot-service';

export async function GET() {
  let round = await getOpenRound();
  if (round.endsAt < new Date()) {
    await settleRound(round.id);
    round = await getOpenRound();
  }
  return NextResponse.json({
    ok: true,
    round: {
      id: round.id,
      endsAt: round.endsAt,
      pot: round.pot,
      status: round.status,
      seedHash: round.seed, // exposed hash/seed for transparency; seed is random uuid here
    },
  });
}
