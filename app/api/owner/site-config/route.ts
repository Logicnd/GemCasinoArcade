import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, requireOwner } from '@/lib/auth/guards';
import { getSiteConfig, updateSiteConfig } from '@/lib/config';

const schema = z.object({
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  dailyBonusBase: z.number().int().optional(),
  streakBonus: z.number().int().optional(),
  streakCap: z.number().int().optional(),
  disclaimer: z.string().optional(),
});

export async function GET() {
  const session = await requireSession();
  requireOwner(session);
  const config = await getSiteConfig();
  return NextResponse.json({ ok: true, config });
}

export async function POST(req: Request) {
  const session = await requireSession();
  requireOwner(session);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const next = await updateSiteConfig(parsed.data, session.user!.id);
  return NextResponse.json({ ok: true, config: next });
}
