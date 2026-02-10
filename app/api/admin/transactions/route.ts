import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, requireAdmin } from '@/lib/auth/guards';

export async function GET(req: Request) {
  const session = await requireSession();
  requireAdmin(session);

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') ?? undefined;
  const type = searchParams.get('type') ?? undefined;

  const transactions = await prisma.gemTransaction.findMany({
    where: {
      userId,
      type: type ? (type as any) : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ ok: true, transactions });
}
