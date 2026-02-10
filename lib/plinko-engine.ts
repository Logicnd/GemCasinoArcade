import { randomInt } from './rng-service';

type Risk = 'low' | 'medium' | 'high';

export interface PlinkoConfig {
  rows: number[];
  risks: Risk[];
  multipliers: Record<Risk, number[]>;
  minBet?: number;
  maxBet?: number;
}

export function generatePath(rows: number) {
  const path: ('L' | 'R')[] = [];
  for (let i = 0; i < rows; i++) {
    path.push(randomInt(2) === 0 ? 'L' : 'R');
  }
  return path;
}

export function resolvePlinkoMultiplier(path: ('L' | 'R')[], risk: Risk, multipliers: Record<Risk, number[]>) {
  const rights = path.filter((p) => p === 'R').length;
  const buckets = multipliers[risk];
  const bucketIndex = Math.min(buckets.length - 1, Math.round((rights / path.length) * (buckets.length - 1)));
  const multiplier = buckets[bucketIndex] ?? 0;
  return { bucketIndex, multiplier };
}
