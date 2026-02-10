
import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto space-y-8 py-12">
        <Link href="/" className="text-primary hover:underline">← Back to Home</Link>
        
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        
        <div className="space-y-6 text-zinc-300">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          
          <p>
            Gem Casino ("we", "us") respects your privacy. This Privacy Policy explains how we handle your data.
          </p>

          <h2 className="text-2xl font-bold text-white">1. Data Collection</h2>
          <p>
            We do <strong>not</strong> collect personal information (PII) such as your name, email, or address.
            We do not use cookies for tracking or advertising.
          </p>

          <h2 className="text-2xl font-bold text-white">2. Local Storage</h2>
          <p>
            We use your browser's Local Storage to save your game progress (Gem balance, settings, streaks). 
            This data stays on your device and is not sent to our servers, except when verifying game outcomes (if applicable).
          </p>

          <h2 className="text-2xl font-bold text-white">3. Analytics</h2>
          <p>
            We may use anonymous usage data (e.g., Vercel Analytics) to understand site performance. 
            This data is aggregated and cannot identify you personally.
          </p>

          <h2 className="text-2xl font-bold text-white">4. Contact</h2>
          <p>
            If you have questions, please contact the developer via GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}
