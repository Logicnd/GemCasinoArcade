'use client';

import { useState } from 'react';

export default function MinesPage() {
  const [bet, setBet] = useState(10);
  const [mines, setMines] = useState(5);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const start = async () => {
    setMessage(null);
    const res = await fetch('/api/games/mines/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet, minesCount: mines }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? 'Start failed');
      return;
    }
    setRoundId(data.roundId);
    setBalance(data.balance);
    setMultiplier(null);
    setMessage('Round started. Reveal tiles!');
  };

  const reveal = async (tile: number) => {
    if (!roundId) return;
    const res = await fetch('/api/games/mines/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, tileIndex: tile }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? 'Reveal failed');
      return;
    }
    if (data.lost) {
      setMessage('Boom! You hit a mine.');
      setRoundId(null);
      setMultiplier(null);
    } else {
      setMultiplier(data.multiplier);
      setMessage(`Safe! Potential ${data.potentialPayout}`);
    }
  };

  const cashout = async () => {
    if (!roundId) return;
    const res = await fetch('/api/games/mines/cashout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? 'Cashout failed');
      return;
    }
    setMessage(`Cashed out ${data.payout}`);
    setBalance(data.balance);
    setRoundId(null);
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Mines</h1>
      <div className="flex gap-3 items-center">
        <input type="number" value={bet} onChange={(e) => setBet(Number(e.target.value))} className="bg-card border border-border rounded px-3 py-2 w-24" />
        <input type="number" value={mines} onChange={(e) => setMines(Number(e.target.value))} className="bg-card border border-border rounded px-3 py-2 w-24" />
        <button onClick={start} className="bg-primary text-white px-4 py-2 rounded">
          Start
        </button>
        {balance !== null && <span className="text-sm text-muted-foreground">Balance: {balance}</span>}
      </div>
      {roundId && (
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => reveal(idx)}
              className="aspect-square bg-card border border-border rounded text-xs"
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
      {multiplier && <div className="text-sm">Multiplier: {multiplier}x</div>}
      {roundId && (
        <button onClick={cashout} className="bg-emerald-600 text-white px-4 py-2 rounded">
          Cashout
        </button>
      )}
      {message && <div className="text-sm text-muted-foreground">{message}</div>}
    </main>
  );
}
