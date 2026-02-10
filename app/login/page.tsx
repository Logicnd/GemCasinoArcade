'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const username = form.get('username') as string;
    const password = form.get('password') as string;
    const res = await signIn('credentials', { redirect: false, username, password });
    if (res?.error) {
      setError('Invalid login');
    } else {
      router.push('/lobby');
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Login</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="username" placeholder="Username" required className="w-full bg-card border border-border rounded px-3 py-2" />
        <input name="password" type="password" placeholder="Password" required className="w-full bg-card border border-border rounded px-3 py-2" />
        <button type="submit" className="w-full bg-primary text-white font-semibold rounded py-2">
          Login
        </button>
      </form>
    </main>
  );
}
