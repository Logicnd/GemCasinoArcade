
'use client';

import { useState } from 'react';
import { usePlayerStore } from '@/store/player-store';
import { ECONOMY, SlotSymbol } from '@/lib/economy';
import { SpinResult } from '@/lib/slots-engine';
import { Reel } from './Reel';
import { Loader2, Trophy, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function SlotsGame() {
  const gems = usePlayerStore((state) => state.gems);
  const deductGems = usePlayerStore((state) => state.deductGems);
  const addGems = usePlayerStore((state) => state.addGems);
  const settings = usePlayerStore((state) => state.settings);

  const [bet, setBet] = useState(ECONOMY.MIN_BET);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [winAnimation, setWinAnimation] = useState(false);

  const handleSpin = async () => {
    if (isSpinning) return;
    setError(null);
    setWinAnimation(false);

    // 1. Deduct Bet
    const success = deductGems(bet);
    if (!success) {
      setError("Not enough gems!");
      return;
    }

    setIsSpinning(true);
    setResult(null); // Clear previous result (visuals will keep showing old until new one comes? Or reset?)
    // Ideally we keep showing the old symbols until the new ones are ready to "stop".
    // But `Reel` component handles "spinning" state by randomizing.
    
    try {
      // 2. Call API
      const res = await fetch('/api/rng/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Spin failed');
      }

      const spinResult = data.result as SpinResult;

      // 3. Wait for min spin time (visuals)
      // If reduced motion, shorter wait.
      const waitTime = settings.reducedMotion ? 500 : 2000;
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // 4. Set result (Reels will stop sequentially based on this data)
      setResult(spinResult);
      setIsSpinning(false); // Trigger stops

      // 5. Handle Win (after reels stop? We can delay the "Win" popup)
      if (spinResult.isWin) {
        setTimeout(() => {
          addGems(spinResult.payout);
          setWinAnimation(true);
        }, settings.reducedMotion ? 100 : 1500); // Wait for reels to stop (Reel delay is 0, 200, 400...)
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message);
      addGems(bet); // Refund
      setIsSpinning(false);
    }
  };

  const handleBetChange = (delta: number) => {
    setBet(prev => {
      const next = prev + delta;
      if (next < ECONOMY.MIN_BET) return ECONOMY.MIN_BET;
      if (next > ECONOMY.MAX_BET) return ECONOMY.MAX_BET;
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8">
      
      {/* Game Area */}
      <div className="relative w-full bg-gradient-to-b from-zinc-800 to-zinc-900 p-8 rounded-3xl border-4 border-yellow-600/50 shadow-2xl">
        
        {/* Reels Container */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-black/50 p-6 rounded-2xl border-inner shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
          {/* We need 3 reels. If no result yet, show placeholders or last result? 
              For MVP initial state, just show random symbols? 
          */}
          {[0, 1, 2].map((i) => (
            <Reel 
              key={i} 
              symbol={result?.grid[i][1] || null} // Show middle row
              isSpinning={isSpinning}
              delay={i * (settings.reducedMotion ? 0 : 300)} // Staggered stop
            />
          ))}
          
          {/* Payline Indicator */}
          <div className="absolute left-4 right-4 top-1/2 h-1 bg-red-500/30 pointer-events-none -translate-y-1/2 z-0" />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-950/50 p-6 rounded-xl border border-white/5">
          
          {/* Bet Controls */}
          <div className="flex items-center gap-4">
            <div className="text-zinc-400 font-bold uppercase text-sm">Bet</div>
            <div className="flex items-center bg-black/40 rounded-lg border border-zinc-700 p-1">
              <button 
                onClick={() => handleBetChange(-10)}
                disabled={isSpinning || bet <= ECONOMY.MIN_BET}
                className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-200 disabled:opacity-50"
              >
                -
              </button>
              <div className="w-16 text-center font-mono font-bold text-xl text-yellow-400">
                {bet}
              </div>
              <button 
                onClick={() => handleBetChange(10)}
                disabled={isSpinning || bet >= ECONOMY.MAX_BET}
                className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-200 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Spin Button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={clsx(
              "relative px-12 py-4 rounded-full font-black text-2xl uppercase tracking-widest transition-all transform",
              isSpinning 
                ? "bg-zinc-700 text-zinc-500 cursor-not-allowed scale-95" 
                : "bg-gradient-to-b from-yellow-400 to-yellow-600 text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] active:scale-95 shadow-lg border-b-4 border-yellow-800"
            )}
          >
            {isSpinning ? (
              <Loader2 className="animate-spin mx-auto" size={32} />
            ) : (
              "SPIN"
            )}
          </button>

          {/* Last Win / Info */}
          <div className="text-right min-w-[120px]">
            <div className="text-zinc-400 font-bold uppercase text-sm">Win</div>
            <div className="text-2xl font-mono font-bold text-emerald-400">
              {winAnimation ? result?.payout : 0}
            </div>
          </div>

        </div>

        {/* Win Overlay */}
        {winAnimation && result?.isWin && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-in zoom-in fade-in duration-300">
            <div className="bg-black/80 backdrop-blur-sm p-8 rounded-3xl border-4 border-emerald-500 text-center shadow-[0_0_100px_rgba(16,185,129,0.5)] transform scale-110">
              <Trophy className="mx-auto text-yellow-400 mb-4 animate-bounce" size={64} />
              <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-emerald-400 mb-2">
                BIG WIN!
              </h2>
              <p className="text-3xl font-bold text-white">
                +{result.payout} Gems
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Instructions */}
      <div className="text-zinc-500 text-sm max-w-lg text-center">
        <p>Match 3 symbols on the center line to win.</p>
        <p>Gems are virtual currency only. No real money.</p>
      </div>

    </div>
  );
}
