'use client';

import { useState } from 'react';

export default function CasesPage() {
  const [caseKey, setCaseKey] = useState('starter');
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  const openCase = async () => {
    setMessage(null);
    const res = await fetch('/api/cases/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseKey }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? 'Open failed');
    } else {
      setResult(data);
      setMessage(`You received item ${data.itemId} (${data.rarity})`);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Cases</h1>
      <div className="flex gap-3 items-center">
        <input value={caseKey} onChange={(e) => setCaseKey(e.target.value)} className="bg-card border border-border rounded px-3 py-2" />
        <button onClick={openCase} className="bg-primary text-white px-4 py-2 rounded">
          Open
        </button>
      </div>
      {message && <div className="text-sm text-muted-foreground">{message}</div>}
      {result && (
        <div className="text-sm">
          Ref: {result.refId} — Item: {result.itemId} ({result.rarity})
        </div>
      )}
    </main>
  );
}
