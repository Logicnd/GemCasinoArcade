import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, requireAdmin } from '@/lib/auth/guards';

export async function GET() {
  const session = await requireSession();
  requireAdmin(session);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ ok: true, logs });
}
