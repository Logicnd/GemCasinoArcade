import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, requireOwner } from '@/lib/auth/guards';
import { Role } from '@prisma/client';

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'USER']),
  action: z.enum(['add', 'remove']),
});

export async function POST(req: Request) {
  const session = await requireSession();
  requireOwner(session);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const { userId, role, action } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let roles = new Set(user.roles);
  if (action === 'add') roles.add(role as Role);
  else roles.delete(role as Role);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { roles: Array.from(roles) as Role[] },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user!.id,
      targetUserId: userId,
      actionType: 'role_change',
      reason: `${action} ${role}`,
    },
  });

  return NextResponse.json({ ok: true, user: { id: updated.id, roles: updated.roles } });
}
