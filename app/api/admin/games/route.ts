import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { updateGameConfig } from '@/lib/config';

const updateSchema = z.object({
  key: z.string().min(1),
  config: z.record(z.string(), z.any()),
  enabled: z.boolean().optional(),
});

export async function GET() {
  const session = await requireSession();
  requireAdmin(session);
  const configs = await prisma.gameConfig.findMany();
  return NextResponse.json({ ok: true, configs });
}

export async function POST(req: Request) {
  const session = await requireSession();
  requireAdmin(session);

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const { key, config, enabled } = parsed.data;
  const updated = await updateGameConfig(key, { config, enabled }, session.user!.id);
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user!.id,
      actionType: 'game_config_update',
      reason: `Updated ${key}`,
      metadata: { key, version: updated.version },
    },
  });

  return NextResponse.json({ ok: true, config: updated });
}
