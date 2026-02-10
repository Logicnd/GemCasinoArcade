'use client';

import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => setUser(data.user));
  }, []);

  if (!user) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-3">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className="p-4 rounded-lg border border-border/60 bg-card">
        <div className="font-semibold">{user.username}</div>
        <div className="text-sm text-muted-foreground">Gems: {user.gemsBalance}</div>
        <div className="text-sm text-muted-foreground">Roles: {user.roles.join(', ')}</div>
        {user.publicTag && <div className="text-sm">Tag: {user.publicTag}</div>}
      </div>
    </main>
  );
}
