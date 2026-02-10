import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hash } from 'bcrypt';
import { Role } from '@prisma/client';
import { rolesForNewUser } from '@/lib/auth/utils';

const signupSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
  publicTag: z.preprocess(
    (value) => {
      if (typeof value === 'string' && value.trim() === '') return undefined;
      return value;
    },
    z.string().min(1).max(20).optional()
  ),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      console.error('[Signup] Validation error:', parsed.error.format());
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const { username, password, publicTag } = parsed.data;

    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { username } });
      if (existing) throw new Error('Username taken');

      // Hash password after username check to avoid unnecessary computation
      const passwordHash = await hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12));

      const userCount = await tx.user.count();
      const roles: Role[] = rolesForNewUser(userCount);

      return tx.user.create({
        data: {
          username,
          passwordHash,
          roles,
          gemsBalance: 1000,
          settings: {
            sound: true,
            reducedMotion: false,
            remindersEnabled: false,
            selfLimits: null,
          },
          publicTag,
          ageGateAcceptedAt: null,
        },
      });
    });

    return NextResponse.json({ ok: true, userId: user.id, roles: user.roles });
  } catch (err: unknown) {
    console.error('[Signup] Error:', err);
    const message = err instanceof Error && err.message === 'Username taken' ? 'Username already in use' : 'Signup failed';
    const status = err instanceof Error && err.message === 'Username taken' ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
