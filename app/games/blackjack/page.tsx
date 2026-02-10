'use client';

import { useState } from 'react';

type Hand = number[];

export default function BlackjackPage() {
  const [bet, setBet] = useState(10);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [player, setPlayer] = useState<Hand>([]);
  const [dealer, setDealer] = useState<(number | null)[]>([]);
  const [status, setStatus] = useState<string>('READY');
  const [message, setMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const start = async () => {
    setMessage(null);
    const res = await fetch('/api/games/blackjack/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? 'Start failed');
      return;
    }
    setSessionId(data.sessionId);
    setPlayer(data.state.player);
    setDealer(data.state.dealer);
    setStatus(data.state.status);
    setBalance(data.balance);
  };

  const act = async (action: 'hit' | 'stand' | 'double') => {
    if (!sessionId) return;
    const res = await fetch(`/api/games/blackjack/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? `${action} failed`);
      return;
    }
    const state = data.state ?? data;
    setPlayer(state.player);
    setDealer(state.dealer);
    setStatus(state.status);
    if (data.balance) setBalance(data.balance);
    if (data.payout !== undefined) setMessage(`Payout ${data.payout}`);
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Blackjack</h1>
      <div className="flex gap-3 items-center">
        <input type="number" value={bet} onChange={(e) => setBet(Number(e.target.value))} className="bg-card border border-border rounded px-3 py-2 w-24" />
        <button onClick={start} className="bg-primary text-white px-4 py-2 rounded">
          Deal
        </button>
        {balance !== null && <span className="text-sm text-muted-foreground">Balance: {balance}</span>}
      </div>
      <div className="space-y-2">
        <div>Player: {player.join(', ')}</div>
        <div>Dealer: {dealer.join(', ')}</div>
        <div>Status: {status}</div>
      </div>
      {sessionId && status === 'ACTIVE' && (
        <div className="flex gap-2">
          <button onClick={() => act('hit')} className="px-3 py-2 bg-white/10 rounded">
            Hit
          </button>
          <button onClick={() => act('stand')} className="px-3 py-2 bg-white/10 rounded">
            Stand
          </button>
          <button onClick={() => act('double')} className="px-3 py-2 bg-white/10 rounded">
            Double
          </button>
        </div>
      )}
      {message && <div className="text-sm text-muted-foreground">{message}</div>}
    </main>
  );
}
