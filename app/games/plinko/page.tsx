'use client';

import { useState } from 'react';

export default function PlinkoPage() {
  const [bet, setBet] = useState(10);
  const [rows, setRows] = useState(12);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [path, setPath] = useState<string[]>([]);
  const [result, setResult] = useState<{ multiplier: number; payout: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const drop = async () => {
    setMessage(null);
    const res = await fetch('/api/games/plinko/drop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet, rows, risk }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? 'Drop failed');
      return;
    }
    setPath(data.path);
    setResult({ multiplier: data.multiplier, payout: data.payout });
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Plinko</h1>
      <div className="flex gap-3 items-center">
        <input type="number" value={bet} onChange={(e) => setBet(Number(e.target.value))} className="bg-card border border-border rounded px-3 py-2 w-24" />
        <input type="number" value={rows} onChange={(e) => setRows(Number(e.target.value))} className="bg-card border border-border rounded px-3 py-2 w-24" />
        <select value={risk} onChange={(e) => setRisk(e.target.value as any)} className="bg-card border border-border rounded px-3 py-2">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button onClick={drop} className="bg-primary text-white px-4 py-2 rounded">
          Drop
        </button>
      </div>
      {path.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Path: {path.join(' ')} | Multiplier: {result?.multiplier} | Payout: {result?.payout}
        </div>
      )}
      {message && <div className="text-sm text-red-400">{message}</div>}
    </main>
  );
}
