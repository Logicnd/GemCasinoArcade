'use client';

import { useEffect, useState } from 'react';

export default function JackpotPage() {
  const [round, setRound] = useState<any>(null);
  const [amount, setAmount] = useState(50);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch('/api/games/jackpot/current-round');
    const data = await res.json();
    if (res.ok) setRound(data.round);
  };

  useEffect(() => {
    load();
  }, []);

  const enter = async () => {
    const res = await fetch('/api/games/jackpot/enter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? 'Entry failed');
    } else {
      setMessage('Entered jackpot');
      load();
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Jackpot</h1>
      {round && (
        <div className="p-4 border border-border rounded bg-card">
          <div>Round ID: {round.id}</div>
          <div>Pot: {round.pot}</div>
          <div>Ends: {new Date(round.endsAt).toLocaleTimeString()}</div>
        </div>
      )}
      <div className="flex gap-3 items-center">
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="bg-card border border-border rounded px-3 py-2 w-24" />
        <button onClick={enter} className="bg-primary text-white px-4 py-2 rounded">
          Enter
        </button>
      </div>
      {message && <div className="text-sm text-muted-foreground">{message}</div>}
    </main>
  );
}
