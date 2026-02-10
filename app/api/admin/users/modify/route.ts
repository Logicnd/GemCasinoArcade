import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, requireAdmin } from '@/lib/auth/guards';
import { GemTransactionType } from '@prisma/client';
import { recordGemTransaction } from '@/lib/ledger';
import { randomUUID } from 'crypto';

const schema = z.object({
  userId: z.string().min(1),
  action: z.enum(['ban', 'unban', 'adjustGems']),
  amount: z.number().int().optional(),
  reason: z.string().min(3),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }
  const session = await requireSession();
  requireAdmin(session);

  const { userId, action, amount = 0, reason } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: userId } });
    if (!target) throw new Error('User not found');

    if (action === 'ban') {
      await tx.user.update({ where: { id: userId }, data: { isBanned: true, banReason: reason } });
    } else if (action === 'unban') {
      await tx.user.update({ where: { id: userId }, data: { isBanned: false, banReason: null } });
    } else if (action === 'adjustGems') {
      if (!amount) throw new Error('Amount required');
      await recordGemTransaction(userId, amount, GemTransactionType.ADMIN_ADJUST, randomUUID(), tx, { reason });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.user!.id,
        targetUserId: userId,
        actionType: action,
        reason,
      },
    });

    return true;
  });

  return NextResponse.json({ ok: result });
}
