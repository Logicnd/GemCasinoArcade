import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth/guards';
import { getSiteConfig } from '@/lib/config';
import { GemTransactionType } from '@prisma/client';
import { recordGemTransaction } from '@/lib/ledger';
import { randomUUID } from 'crypto';
import { canClaimDaily } from '@/lib/auth/utils';

function isSameDay(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

export async function POST() {
  const session = await requireSession();
  const userId = session.user!.id;
  const site = await getSiteConfig();

  const lastClaim = await prisma.gemTransaction.findFirst({
    where: { userId, type: GemTransactionType.DAILY_BONUS },
    orderBy: { createdAt: 'desc' },
  });

  if (lastClaim && !canClaimDaily(lastClaim.createdAt, new Date())) {
    return NextResponse.json({ error: 'Already claimed today' }, { status: 400 });
  }

  let streak = 1;
  if (lastClaim) {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    if (isSameDay(lastClaim.createdAt, yesterday)) {
      const metaStreak = (lastClaim.metadata as any)?.streak ?? 1;
      streak = metaStreak + 1;
    }
  }

  const streakBonus = Math.min(site.streakBonus * Math.max(streak - 1, 0), site.streakCap);
  const total = site.dailyBonusBase + streakBonus;
  const refId = randomUUID();

  const balance = await recordGemTransaction(userId, total, GemTransactionType.DAILY_BONUS, refId, prisma, {
    streak,
  });

  return NextResponse.json({ ok: true, amount: total, streak, balance });
}
