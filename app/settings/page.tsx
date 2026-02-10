'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [sound, setSound] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [maxLoss, setMaxLoss] = useState<number | null>(null);
  const [maxPlays, setMaxPlays] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        setSound(data.user?.settings?.sound ?? true);
        setReducedMotion(data.user?.settings?.reducedMotion ?? false);
        setMaxLoss(data.user?.settings?.selfLimits?.maxLossPerDay ?? null);
        setMaxPlays(data.user?.settings?.selfLimits?.maxPlaysPerDay ?? null);
      });
  }, []);

  const save = async () => {
    const res = await fetch('/api/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sound,
        reducedMotion,
        ageGateAccepted: true,
        selfLimits: { maxLossPerDay: maxLoss, maxPlaysPerDay: maxPlays },
      }),
    });
    const data = await res.json();
    if (res.ok) setMessage('Saved');
    else setMessage(data.error ?? 'Failed');
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Settings</h1>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Sound enabled
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} /> Reduced motion
      </label>
      <div className="flex flex-col gap-2 text-sm">
        <label className="flex items-center gap-2">
          <span className="w-40">Max loss per day</span>
          <input
            type="number"
            value={maxLoss ?? ''}
            onChange={(e) => setMaxLoss(e.target.value === '' ? null : Number(e.target.value))}
            className="bg-card border border-border rounded px-3 py-1"
            placeholder="None"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-40">Max plays per day</span>
          <input
            type="number"
            value={maxPlays ?? ''}
            onChange={(e) => setMaxPlays(e.target.value === '' ? null : Number(e.target.value))}
            className="bg-card border border-border rounded px-3 py-1"
            placeholder="None"
          />
        </label>
      </div>
      <button onClick={save} className="bg-primary text-white px-4 py-2 rounded">
        Save
      </button>
      {message && <div className="text-sm text-muted-foreground">{message}</div>}
    </main>
  );
}
