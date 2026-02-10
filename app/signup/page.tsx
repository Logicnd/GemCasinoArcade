'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const username = form.get('username');
    const password = form.get('password');
    const publicTagRaw = form.get('publicTag');
    const publicTag = typeof publicTagRaw === 'string' ? publicTagRaw.trim() : '';
    const payload = {
      username,
      password,
      ...(publicTag ? { publicTag } : {}),
    };
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Signup failed');
      return;
    }
    await signIn('credentials', { redirect: false, username: payload.username, password: payload.password });
    router.push('/lobby');
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Create Account</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="username" placeholder="Username" required className="w-full bg-card border border-border rounded px-3 py-2" />
        <input name="password" type="password" placeholder="Password" required className="w-full bg-card border border-border rounded px-3 py-2" />
        <input name="publicTag" placeholder="Public tag (optional)" className="w-full bg-card border border-border rounded px-3 py-2" />
        <button type="submit" className="w-full bg-primary text-white font-semibold rounded py-2">
          Sign Up
        </button>
      </form>
    </main>
  );
}
