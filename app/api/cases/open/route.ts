import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { openCaseByKey } from '@/lib/case-service';

const schema = z.object({
  caseKey: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
  }

  const session = await requireSession();
  const { caseKey } = parsed.data;

  try {
    const result = await prisma.$transaction((tx) => openCaseByKey(session.user!.id, caseKey, tx));
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Open failed' }, { status: 400 });
  }
}
