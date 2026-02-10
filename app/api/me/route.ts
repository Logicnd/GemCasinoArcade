import { NextResponse } from 'next/server';
import { requireSession, loadUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: { id: session.user!.id },
      select: {
        id: true,
        username: true,
        roles: true,
        gemsBalance: true,
        shardsBalance: true,
        publicTag: true,
        isBanned: true,
        settings: true,
        equippedTitleId: true,
        ageGateAcceptedAt: true,
      },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: 'Banned' }, { status: 403 });
    return NextResponse.json({ user });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status });
  }
}
