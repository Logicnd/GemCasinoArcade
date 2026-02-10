
'use client';

import { useEffect, useState, useRef } from 'react';
import { SlotSymbol, SLOT_SYMBOLS } from '@/lib/economy';
import { SlotSymbolIcon } from './SlotSymbolIcon';
import clsx from 'clsx';

interface ReelProps {
  symbol: SlotSymbol | null; // Final symbol to show
  isSpinning: boolean;
  delay?: number; // Delay start of stop animation
  onStop?: () => void;
}

export function Reel({ symbol, isSpinning, delay = 0, onStop }: ReelProps) {
  const [displaySymbol, setDisplaySymbol] = useState<SlotSymbol>(SLOT_SYMBOLS[0]);
  const [internalSpinning, setInternalSpinning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSpinning) {
      setInternalSpinning(true);
      // Start rapid cycling for visual effect
      intervalRef.current = setInterval(() => {
        const random = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        setDisplaySymbol(random);
      }, 100);
    } else {
      // Stop sequence with delay
      if (internalSpinning) {
        setTimeout(() => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (symbol) setDisplaySymbol(symbol);
          setInternalSpinning(false);
          onStop?.();
        }, delay);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSpinning, symbol, delay, internalSpinning, onStop]);

  return (
    <div className="relative w-full aspect-[3/4] overflow-hidden bg-black/40 rounded-xl border-2 border-zinc-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
      <div className={clsx(
        "w-full h-full flex items-center justify-center p-2 transition-all duration-200",
        internalSpinning ? "blur-sm scale-110 opacity-80" : "blur-0 scale-100 opacity-100"
      )}>
        <SlotSymbolIcon 
          symbol={displaySymbol} 
          size="lg" 
          className="w-full h-full bg-transparent border-none shadow-none" 
        />
      </div>
      
      {/* Reel Overlay/Highlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
    </div>
  );
}
