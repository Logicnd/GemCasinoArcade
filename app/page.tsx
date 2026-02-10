
import Link from 'next/link';
import { Sparkles, ShieldCheck, Gamepad2 } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12 max-w-5xl mx-auto w-full">
      
      {/* Hero Section */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
          <Sparkles size={14} />
          <span>Free-to-Play Arcade</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Gem <span className="text-primary text-glow">Casino</span>
        </h1>
        
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Experience the thrill of casino-style games with <span className="text-emerald-400 font-bold">ZERO risk</span>. 
          No real money. No deposits. Just Gems and fun.
        </p>

        <div className="pt-4">
          <Link 
            href="/lobby" 
            className="inline-block bg-primary hover:bg-primary/90 text-white text-lg font-bold py-4 px-12 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.7)]"
          >
            Enter Lobby
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 w-full pt-12 text-left">
        <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
            <Sparkles />
          </div>
          <h3 className="text-xl font-bold mb-2">Gems Only</h3>
          <p className="text-zinc-400">
            Play with virtual currency. We give you free gems daily. No way to spend real money here.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
            <Gamepad2 />
          </div>
          <h3 className="text-xl font-bold mb-2">Instant Fun</h3>
          <p className="text-zinc-400">
            No registration required. Your progress is saved to your device instantly.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
            <ShieldCheck />
          </div>
          <h3 className="text-xl font-bold mb-2">100% Safe</h3>
          <p className="text-zinc-400">
            Designed for entertainment. No loot boxes, no dark patterns, no cash-out mechanisms.
          </p>
        </div>
      </div>

      {/* Footer / Legal */}
      <footer className="w-full pt-20 pb-10 text-zinc-600 text-sm">
        <div className="flex justify-center gap-6 mb-8">
          <Link href="/about" className="hover:text-primary">About</Link>
          <Link href="/responsible-play" className="hover:text-primary">Responsible Play</Link>
          <Link href="/privacy" className="hover:text-primary">Privacy</Link>
        </div>
        <p>
          Gem Casino is a social casino game for entertainment purposes only. 
          No real money gambling or prizes are offered.
        </p>
      </footer>
    </main>
  );
}
