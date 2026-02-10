'use client';

import { useEffect, useState } from 'react';

interface SpinResult {
  payout: number;
  winLines: number[];
  isWin: boolean;
  grid: { id: string; name: string; icon: string }[][];
}

export default function SlotsPage() {
  const [bet, setBet] = useState(10);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = async () => {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (res.ok) setBalance(data.user.gemsBalance);
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const spin = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/games/slots/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Spin failed');
    } else {
      setResult(data.result);
      setBalance(data.balance);
    }
    setLoading(false);
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Slots</h1>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={bet}
          min={1}
          onChange={(e) => setBet(Number(e.target.value))}
          className="bg-card border border-border rounded px-3 py-2 w-32"
        />
        <button
          onClick={spin}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Spinning...' : 'Spin'}
        </button>
        {balance !== null && <span className="text-sm text-muted-foreground">Balance: {balance}</span>}
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {result && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {result.grid.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-1">
                {col.map((s, ri) => (
                  <div key={ri} className="border border-border rounded p-2 text-center bg-card">
                    {s.icon} {s.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="text-sm">
            {result.isWin ? `Payout: ${result.payout}` : 'No win'} | Lines: {result.winLines.join(', ') || '-'}
          </div>
        </div>
      )}
    </main>
  );
}
