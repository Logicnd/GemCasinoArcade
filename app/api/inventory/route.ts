import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requireSession();
  const items = await prisma.inventory.findMany({
    where: { userId: session.user!.id },
    include: { item: true },
  });
  return NextResponse.json({ ok: true, items });
}
