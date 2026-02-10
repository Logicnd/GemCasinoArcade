import { Role } from '@prisma/client';

export function rolesForNewUser(userCount: number): Role[] {
  return userCount === 0 ? [Role.OWNER, Role.ADMIN, Role.USER] : [Role.USER];
}

export function canClaimDaily(lastClaim: Date | null, now: Date = new Date()) {
  if (!lastClaim) return true;
  const todayStr = now.toISOString().split('T')[0];
  const lastStr = lastClaim.toISOString().split('T')[0];
  return todayStr !== lastStr;
}
