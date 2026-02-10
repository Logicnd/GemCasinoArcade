import { describe, it, expect, vi, afterEach } from 'vitest';
import { rollRarity, pickItem } from '../lib/case-service';
import * as rng from '../lib/rng-service';
import { minesMultiplier } from '../lib/mines-engine';
import { settle } from '../lib/blackjack-engine';
import { rolesForNewUser, canClaimDaily } from '../lib/auth/utils';
import { recordGemTransaction } from '../lib/ledger';
import { GemTransactionType } from '@prisma/client';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Case rarity + selection', () => {
  it('picks rarity based on weights', () => {
    vi.spyOn(rng, 'randomFloat').mockReturnValue(0.0);
    expect(rollRarity({ COMMON: 1, RARE: 0 })).toBe('COMMON');

    vi.spyOn(rng, 'randomFloat').mockReturnValue(0.99);
    expect(rollRarity({ COMMON: 1, RARE: 1 })).toBe('RARE');
  });

  it('picks item from pool', () => {
    vi.spyOn(rng, 'randomInt').mockReturnValue(1);
    expect(pickItem(['a', 'b', 'c'])).toBe('b');
  });
});

describe('Slots payout', () => {
  it('mines multiplier increases with reveals', () => {
    const m1 = minesMultiplier(1, 3);
    const m2 = minesMultiplier(2, 3);
    const m3 = minesMultiplier(3, 3);
    expect(m2).toBeGreaterThan(m1);
    expect(m3).toBeGreaterThan(m2);
  });
});

describe('Blackjack settlement', () => {
  it('pays 2x on player win', () => {
    const state: any = { player: [10, 9], dealer: [8, 9], status: 'PLAYER_WIN' };
    expect(settle(state, 20)).toBe(40);
  });

  it('pays 0 on bust', () => {
    const state: any = { player: [10, 9, 5], dealer: [8, 9], status: 'PLAYER_BUST' };
    expect(settle(state, 20)).toBe(0);
  });
});

describe('RBAC + limits', () => {
  it('first user becomes owner+admin', () => {
    expect(rolesForNewUser(0)).toContain('OWNER');
    expect(rolesForNewUser(0)).toContain('ADMIN');
    expect(rolesForNewUser(1)).not.toContain('OWNER');
  });

  it('daily claim only once per day', () => {
    const now = new Date('2026-02-10T12:00:00Z');
    const last = new Date('2026-02-10T01:00:00Z');
    expect(canClaimDaily(last, now)).toBe(false);
    const yesterday = new Date('2026-02-09T23:00:00Z');
    expect(canClaimDaily(yesterday, now)).toBe(true);
  });

  it('banned user cannot spend', async () => {
    const fakeTx: any = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ gemsBalance: 1000, isBanned: true, settings: null }),
      },
    };
    await expect(
      recordGemTransaction('u1', -10, GemTransactionType.SLOTS_BET, 'ref', fakeTx, {})
    ).rejects.toThrow('User is banned');
  });
});
