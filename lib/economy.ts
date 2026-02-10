
export const ECONOMY = {
  INITIAL_GEMS: 1000,
  DAILY_BONUS_BASE: 250,
  DAILY_BONUS_STREAK_INCREMENT: 25,
  DAILY_BONUS_STREAK_CAP: 250, // Max streak bonus (e.g., 10 days * 25)
  MIN_BET: 10,
  MAX_BET: 200,
} as const;

export type SymbolId = 'gem' | 'seven' | 'crown' | 'star' | 'heart' | 'coin' | 'cherry';

export interface SlotSymbol {
  id: SymbolId;
  name: string;
  icon: string; // Placeholder for emoji or icon name
  weight: number; // For weighted random selection (higher = more frequent)
}

// Weights are relative. Total weight sum will be the denominator.
// Adjusted to have a reasonable RTP. 
// Low value symbols should have high weight, high value symbols low weight.
export const SLOT_SYMBOLS: SlotSymbol[] = [
  { id: 'gem', name: 'Gem', icon: '💎', weight: 1 },       // Jackpot
  { id: 'seven', name: 'Seven', icon: '7️⃣', weight: 3 },
  { id: 'crown', name: 'Crown', icon: '👑', weight: 5 },
  { id: 'star', name: 'Star', icon: '⭐', weight: 8 },
  { id: 'heart', name: 'Heart', icon: '❤️', weight: 12 },
  { id: 'coin', name: 'Coin', icon: '🪙', weight: 18 },
  { id: 'cherry', name: 'Cherry', icon: '🍒', weight: 25 }, // Common
];

// Payout multipliers for 3-of-a-kind on the center line
export const PAYOUTS: Record<SymbolId, number> = {
  gem: 100,
  seven: 50,
  crown: 25,
  star: 15,
  heart: 10,
  coin: 5,
  cherry: 3,
};

// Two-of-a-kind payouts (optional, keeps it fun)
// Only for the first two reels matching? Or any two? 
// Usually left-to-right 2 matches.
export const PARTIAL_PAYOUTS: Record<SymbolId, number> = {
  gem: 5,
  seven: 3,
  crown: 2,
  star: 0,
  heart: 0,
  coin: 0,
  cherry: 0,
};
