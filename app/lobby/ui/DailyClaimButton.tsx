'use client';

import { useState } from 'react';

export function DailyClaimButton({ canClaim, lastClaim }: { canClaim: boolean; lastClaim?: string | null }) {
  const [status, setStatus] = useState<'idle' | 'claiming' | 'done'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const onClaim = async () => {
    setStatus('claiming');
    const res = await fetch('/api/economy/daily-claim', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? 'Already claimed today');
      setStatus('idle');
      return;
    }
    setMessage(`+${data.amount} Gems (streak ${data.streak})`);
    setStatus('done');
  };

  return (
    <div className="p-4 border border-border/60 rounded-xl bg-card flex items-center justify-between">
      <div>
        <div className="font-semibold">Daily Bonus</div>
        <div className="text-sm text-muted-foreground">
          {canClaim ? 'Claim your free gems for today.' : `Last claimed: ${lastClaim ?? 'unknown'}`}
        </div>
        {message && <div className="text-emerald-300 text-sm mt-1">{message}</div>}
      </div>
      <button
        onClick={onClaim}
        disabled={!canClaim || status === 'claiming'}
        className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
      >
        {status === 'claiming' ? 'Claiming...' : canClaim ? 'Claim' : 'Come back tomorrow'}
      </button>
    </div>
  );
}
