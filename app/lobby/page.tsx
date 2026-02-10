import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import Link from 'next/link';
import { DailyClaimButton } from './ui/DailyClaimButton';
import { Gem } from 'lucide-react';

async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, gemsBalance: true },
  });
  const lastClaim = await prisma.gemTransaction.findFirst({
    where: { userId, type: 'DAILY_BONUS' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, metadata: true },
  });
  return { user, lastClaim };
}

export default async function LobbyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Lobby</h1>
        <p className="text-muted-foreground">Please <Link href="/login" className="underline">login</Link> to play.</p>
      </main>
    );
  }

  const { user, lastClaim } = await getProfile(session.user.id);
  const lastClaimStr = lastClaim?.createdAt?.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const canClaim = lastClaimStr !== todayStr;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Welcome, {user?.username}</h1>
          <p className="text-muted-foreground">Pick a game, claim daily gems, and have fun.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/40">
          <Gem size={20} className="text-emerald-300" />
          <span className="text-lg font-semibold">{user?.gemsBalance.toLocaleString()} Gems</span>
        </div>
      </div>

      <DailyClaimButton canClaim={canClaim} lastClaim={lastClaimStr} />

      <section className="grid md:grid-cols-3 gap-4">
        {[
          { href: '/games/slots', title: 'Slots', desc: 'Classic 3x3 reels' },
          { href: '/games/mines', title: 'Mines', desc: 'Dodge the bombs, cash out anytime' },
          { href: '/games/plinko', title: 'Plinko', desc: 'Drop chip, chase the multiplier' },
          { href: '/games/blackjack', title: 'Blackjack', desc: 'Beat the dealer to 21' },
          { href: '/games/jackpot', title: 'Jackpot', desc: 'Enter the pooled draw' },
          { href: '/cases', title: 'Cases', desc: 'Open cases, earn titles & cosmetics' },
        ].map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="p-4 rounded-xl border border-border/60 bg-card hover:border-primary/60 transition"
          >
            <div className="text-lg font-semibold">{game.title}</div>
            <div className="text-sm text-muted-foreground">{game.desc}</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
