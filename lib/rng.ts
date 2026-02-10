
// Simple seeded PRNG (Mulberry32)
function mulberry32(a: number) {
  let state = a;
  return function() {
    let t = state += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

function seedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export type RNG = () => number;

export function createRNG(seed?: string): RNG {
  if (seed) {
    const numericSeed = seedFromString(seed);
    const prng = mulberry32(numericSeed);
    return prng; // Returns float 0-1
  }

  return () => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / (0xFFFFFFFF + 1);
    }
    return Math.random();
  };
}

export function getRandomInt(rng: RNG, max: number): number {
  return Math.floor(rng() * max);
}

export function getWeightedRandomItem<T extends { weight: number }>(items: T[], rng: RNG): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let randomValue = getRandomInt(rng, totalWeight);
  
  for (const item of items) {
    if (randomValue < item.weight) {
      return item;
    }
    randomValue -= item.weight;
  }
  
  return items[items.length - 1];
}
