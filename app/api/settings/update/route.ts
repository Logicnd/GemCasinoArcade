import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth/guards';

const settingsSchema = z.object({
  sound: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  remindersEnabled: z.boolean().optional(),
  selfLimits: z
    .object({
      maxLossPerDay: z.number().int().min(0).nullable().optional(),
      maxPlaysPerDay: z.number().int().min(0).nullable().optional(),
    })
    .optional(),
  ageGateAccepted: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const session = await requireSession();
  const { ageGateAccepted, ...settings } = parsed.data;

  const updated = await prisma.user.update({
    where: { id: session.user!.id },
    data: {
      settings: {
        ...(settings as any),
      },
      ageGateAcceptedAt: ageGateAccepted ? new Date() : undefined,
    },
    select: {
      id: true,
      settings: true,
      ageGateAcceptedAt: true,
    },
  });

  return NextResponse.json({ ok: true, user: updated });
}
