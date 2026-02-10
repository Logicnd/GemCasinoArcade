
import { SLOT_SYMBOLS, PAYOUTS, PARTIAL_PAYOUTS, ECONOMY, SlotSymbol } from './economy';
import { createRNG, getWeightedRandomItem } from './rng';

export interface SpinResult {
  grid: SlotSymbol[][]; // 3 reels x 3 rows
  payout: number;
  winLines: number[]; // Indices of winning lines (0, 1, 2) - MVP only supports center (1)
  isWin: boolean;
}

export function calculatePayout(grid: SlotSymbol[][], bet: number): { payout: number, winLines: number[], isWin: boolean } {
  const centerRow = 1;
  const s1 = grid[0][centerRow];
  const s2 = grid[1][centerRow];
  const s3 = grid[2][centerRow];

  let payoutMultiplier = 0;
  const winLines: number[] = [];

  // Check 3-of-a-kind
  if (s1.id === s2.id && s2.id === s3.id) {
    payoutMultiplier = PAYOUTS[s1.id] || 0;
    winLines.push(centerRow);
  } 
  // Check 2-of-a-kind (left-to-right)
  else if (s1.id === s2.id) {
    const partial = PARTIAL_PAYOUTS[s1.id];
    if (partial > 0) {
      payoutMultiplier = partial;
      winLines.push(centerRow);
    }
  }

  const payout = Math.floor(bet * payoutMultiplier);
  
  return { payout, winLines, isWin: payout > 0 };
}

export function calculateSpinResult(bet: number, seed?: string): SpinResult {
  // Validate bet (though caller should also check balance)
  if (bet < ECONOMY.MIN_BET || bet > ECONOMY.MAX_BET) {
    throw new Error(`Bet must be between ${ECONOMY.MIN_BET} and ${ECONOMY.MAX_BET}`);
  }

  const rng = createRNG(seed);
  const reels = 3;
  const rows = 3;
  const grid: SlotSymbol[][] = [];

  // Generate grid
  for (let r = 0; r < reels; r++) {
    const reelSymbols: SlotSymbol[] = [];
    for (let row = 0; row < rows; row++) {
      reelSymbols.push(getWeightedRandomItem(SLOT_SYMBOLS, rng));
    }
    grid.push(reelSymbols);
  }

  const { payout, winLines, isWin } = calculatePayout(grid, bet);

  return {
    grid,
    payout,
    winLines,
    isWin,
  };
}
