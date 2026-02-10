'use client';

import { useEffect, useState } from 'react';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/inventory')
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []));
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Inventory</h1>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((inv) => (
          <div key={inv.id} className="p-3 rounded-lg border border-border/60 bg-card">
            <div className="font-semibold">{inv.item.name}</div>
            <div className="text-xs text-muted-foreground">
              {inv.item.rarity} · {inv.item.type}
            </div>
            <div className="text-sm">Qty: {inv.quantity}</div>
          </div>
        ))}
      </div>
      {items.length === 0 && <div className="text-sm text-muted-foreground">No items yet.</div>}
    </main>
  );
}
