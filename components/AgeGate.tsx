
'use client';

import { useEffect, useState } from 'react';

export function AgeGate() {
  const [mounted, setMounted] = useState(false);
  const [accepted, setAccepted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.ageGateAcceptedAt) setAccepted(true);
      })
      .catch(() => {});
  }, []);

  const accept = async () => {
    setAccepted(true);
    await fetch('/api/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ageGateAccepted: true }),
    });
  };

  if (!mounted || accepted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <h2 className="text-3xl font-bold text-primary text-glow">Welcome to Gem Casino</h2>
        
        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg text-foreground font-medium">
            This is a free-to-play social game.
          </p>
          <ul className="text-sm space-y-2 bg-black/20 p-4 rounded-lg text-left list-disc list-inside">
            <li>No real money gambling</li>
            <li>No cash prizes or withdrawals</li>
            <li>Virtual currency ("Gems") only</li>
            <li>For entertainment purposes only</li>
          </ul>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="mb-4 font-semibold">Please confirm you are 18+ years of age to play.</p>
          <button
            onClick={accept}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            I Confirm I am 18+
          </button>
          <p className="mt-4 text-xs text-zinc-500">
            By entering, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
