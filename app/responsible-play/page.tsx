
import Link from 'next/link';
import { ShieldAlert, Clock, Ban, HeartHandshake } from 'lucide-react';

export default function ResponsiblePlay() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto space-y-12 py-12">
        
        <header className="space-y-4 text-center">
          <Link href="/" className="text-primary hover:underline mb-4 inline-block">← Back to Home</Link>
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <HeartHandshake className="text-emerald-500" size={40} />
            Responsible Play
          </h1>
          <p className="text-xl text-zinc-400">
            Gaming should be fun, safe, and free from harm.
          </p>
        </header>

        <section className="bg-card border border-border rounded-2xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-primary">Our Commitment</h2>
          <p className="text-zinc-300 leading-relaxed">
            Gem Casino is a free-to-play social game. <strong>No real money</strong> is ever involved. 
            However, we understand that habit-forming behaviors can develop even with virtual currency. 
            We are committed to providing a safe environment.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
            <Clock className="text-blue-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Take Breaks</h3>
            <p className="text-zinc-400 text-sm">
              It's easy to lose track of time. We recommend taking a break every 30 minutes.
            </p>
          </div>
          
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
            <ShieldAlert className="text-red-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Under 18s Prohibited</h3>
            <p className="text-zinc-400 text-sm">
              This game is intended for an adult audience (18+) for amusement purposes only.
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Signs of Burnout</h2>
          <ul className="list-disc list-inside space-y-2 text-zinc-300">
            <li>Playing longer than intended.</li>
            <li>Feeling irritable when interrupted.</li>
            <li>Neglecting other responsibilities to play.</li>
            <li>Chasing virtual losses (trying to win back gems).</li>
          </ul>
        </section>

        <section className="bg-red-900/10 border border-red-900/30 p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Need Help?</h2>
          <p className="text-zinc-300 mb-6">
            If you or someone you know is struggling with gambling addiction (even if this site is free), 
            please seek help from professional organizations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="https://www.gamcare.org.uk/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
            >
              GamCare (UK)
            </a>
            <a 
              href="https://www.ncpgambling.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
            >
              NCP Gambling (USA)
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
