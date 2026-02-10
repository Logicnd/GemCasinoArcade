
import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto space-y-8 py-12">
        <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
        
        <h1 className="text-4xl font-bold">About Gem Casino</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
          <p className="text-xl">
            Gem Casino was built to demonstrate a high-quality, safe, and fun casino-style experience without the financial risk.
          </p>
          
          <h2 className="text-2xl font-bold text-white">Our Mission</h2>
          <p>
            We believe the thrill of arcade games shouldn't come at a cost to your wallet. 
            Our platform uses a virtual economy ("Gems") that has no real-world value. 
            You cannot buy gems, and you cannot cash them out.
          </p>

          <h2 className="text-2xl font-bold text-white">How it Works</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Start with 1,000 Gems:</strong> Every new player gets a welcome bonus.</li>
            <li><strong>Daily Bonus:</strong> Log in every day to claim more gems and build your streak.</li>
            <li><strong>Fair Play:</strong> Our games use a transparent RNG (Random Number Generator).</li>
          </ul>

          <h2 className="text-2xl font-bold text-white">Technology</h2>
          <p>
            Built with Next.js, TypeScript, and Tailwind CSS. State is persisted locally on your device.
          </p>
        </div>
      </div>
    </div>
  );
}
