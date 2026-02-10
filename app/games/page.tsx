import Link from 'next/link';

const games = [
  { href: '/games/slots', title: 'Slots', desc: 'Classic reels' },
  { href: '/games/mines', title: 'Mines', desc: 'Avoid bombs' },
  { href: '/games/plinko', title: 'Plinko', desc: 'Drop chip' },
  { href: '/games/blackjack', title: 'Blackjack', desc: 'Beat the dealer' },
  { href: '/games/jackpot', title: 'Jackpot', desc: 'Shared pot' },
];

export default function GamesHub() {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Games</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {games.map((g) => (
          <Link key={g.href} href={g.href} className="p-4 rounded-xl border border-border/60 bg-card hover:border-primary/60">
            <div className="text-lg font-semibold">{g.title}</div>
            <div className="text-sm text-muted-foreground">{g.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
