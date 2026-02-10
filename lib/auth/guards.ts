import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from './options';
import { prisma } from '../prisma';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new AuthError('Unauthorized', 401);
  return session;
}

export function assertRole(session: Awaited<ReturnType<typeof requireSession>>, allowed: Role[]) {
  const roles = session.user?.roles ?? [];
  const ok = roles.some((r) => allowed.includes(r as Role));
  if (!ok) throw new AuthError('Forbidden', 403);
}

export function requireAdmin(session: Awaited<ReturnType<typeof requireSession>>) {
  assertRole(session, [Role.ADMIN, Role.OWNER]);
}

export function requireOwner(session: Awaited<ReturnType<typeof requireSession>>) {
  assertRole(session, [Role.OWNER]);
}

export async function loadUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError('User not found', 404);
  if (user.isBanned) throw new AuthError('User banned', 403);
  return user;
}
