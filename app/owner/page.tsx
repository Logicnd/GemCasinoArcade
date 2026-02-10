import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import Link from 'next/link';

export default async function OwnerPage() {
  const session = await getServerSession(authOptions);
  const roles = session?.user?.roles ?? [];
  const isOwner = roles.includes('OWNER');
  if (!isOwner) return <p className="p-6 text-sm text-red-400">Forbidden</p>;

  const links = [
    { href: '/owner/roles', title: 'Roles' },
    { href: '/owner/site-config', title: 'Site Config' },
    { href: '/owner/config-history', title: 'Config History' },
    { href: '/owner/audit-export', title: 'Audit Export' },
  ];

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Owner</h1>
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
