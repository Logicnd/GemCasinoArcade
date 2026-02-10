
import { describe, it, expect } from 'vitest';
import { calculatePayout, calculateSpinResult } from '../lib/slots-engine';
import { ECONOMY, SLOT_SYMBOLS, PAYOUTS } from '../lib/economy';

describe('Slots Engine', () => {
  it('should validate bet limits', () => {
    expect(() => calculateSpinResult(ECONOMY.MIN_BET - 1)).toThrow();
    expect(() => calculateSpinResult(ECONOMY.MAX_BET + 1)).toThrow();
    expect(() => calculateSpinResult(ECONOMY.MIN_BET)).not.toThrow();
  });

  it('should calculate payout correctly for 3-of-a-kind', () => {
    // Create a grid with 3 Gems in the middle row (index 1)
    const gem = SLOT_SYMBOLS.find(s => s.id === 'gem')!;
    const grid = [
      [gem, gem, gem], // Reel 1 (all gems for simplicity)
      [gem, gem, gem], // Reel 2
      [gem, gem, gem], // Reel 3
    ];
    
    const bet = 10;
    const result = calculatePayout(grid, bet);
    
    expect(result.isWin).toBe(true);
    expect(result.payout).toBe(bet * PAYOUTS.gem);
    expect(result.winLines).toContain(1);
  });

  it('should calculate payout correctly for loss', () => {
    const gem = SLOT_SYMBOLS.find(s => s.id === 'gem')!;
    const cherry = SLOT_SYMBOLS.find(s => s.id === 'cherry')!;
    const coin = SLOT_SYMBOLS.find(s => s.id === 'coin')!;
    
    // Middle row: Gem, Cherry, Coin (no match)
    const grid = [
      [gem, gem, gem],
      [cherry, cherry, cherry],
      [coin, coin, coin],
    ];
    
    const bet = 10;
    const result = calculatePayout(grid, bet);
    
    expect(result.isWin).toBe(false);
    expect(result.payout).toBe(0);
  });

  it('should be deterministic with seed', () => {
    const seed = 'test-seed-123';
    const result1 = calculateSpinResult(10, seed);
    const result2 = calculateSpinResult(10, seed);
    
    expect(result1.grid).toEqual(result2.grid);
    expect(result1.payout).toEqual(result2.payout);
  });
  
  it('should be different with different seeds', () => {
    const result1 = calculateSpinResult(10, 'seed-a');
    const result2 = calculateSpinResult(10, 'seed-b');
    
    // Highly unlikely to match
    expect(result1.grid).not.toEqual(result2.grid);
  });
});
