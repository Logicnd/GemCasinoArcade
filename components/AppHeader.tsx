import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import clsx from 'clsx';

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    OWNER: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
    ADMIN: 'bg-red-500/20 text-red-200 border-red-400/50',
    USER: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
  };
  return (
    <span className={clsx('px-2 py-1 rounded-md text-xs font-semibold border', colors[role] ?? colors.USER)}>
      {role}
    </span>
  );
}

export async function AppHeader() {
  const session = await getServerSession(authOptions);
  const user =
    session?.user &&
    (await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        username: true,
        roles: true,
        gemsBalance: true,
        publicTag: true,
        equippedTitleId: true,
        equippedTitle: { select: { name: true } },
      },
    }));

  return (
    <header className="w-full border-b border-border/60 bg-black/40 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-black tracking-tight">
          <span className="text-primary">Gem</span> Casino Arcade
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{user.username}</span>
                {user.equippedTitle?.name && (
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded-md border border-primary/40">
                    {user.equippedTitle.name}
                  </span>
                )}
                {user.publicTag && <span className="text-xs text-zinc-400">[{user.publicTag}]</span>}
                {user.roles?.map((r) => (
                  <RoleBadge key={r} role={r} />
                ))}
              </div>
              <div className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-200 border border-emerald-500/40">
                {user.gemsBalance.toLocaleString()} Gems
              </div>
              <Link href="/logout" className="underline text-xs text-zinc-400 hover:text-white">
                Logout
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm underline">
                Login
              </Link>
              <Link href="/signup" className="text-sm underline">
                Signup
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
