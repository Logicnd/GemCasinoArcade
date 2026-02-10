import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const roles = session?.user?.roles ?? [];
  const isAdmin = roles.includes('ADMIN') || roles.includes('OWNER');
  if (!isAdmin) {
    return <p className="p-6 text-sm text-red-400">Forbidden</p>;
  }

  const links = [
    { href: '/admin/users', title: 'Users' },
    { href: '/admin/transactions', title: 'Transactions' },
    { href: '/admin/audit', title: 'Audit Logs' },
    { href: '/admin/games', title: 'Game Configs' },
  ];

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Admin</h1>
      <div className="grid md:grid-cols-2 gap-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="p-4 rounded-lg border border-border/60 bg-card">
            <div className="font-semibold">{l.title}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
