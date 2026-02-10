import { randomBytes, createHmac } from 'crypto';

export type RngStream = 'OUTCOME_RNG' | 'LOOT_RNG' | 'JACKPOT_RNG' | 'COSMETIC_RNG';

export function generateServerSeed() {
  const seed = randomBytes(32).toString('hex');
  const hash = createHmac('sha256', 'gca-seed').update(seed).digest('hex');
  return { seed, hash };
}

export function rollProvablyFair(serverSeed: string, clientSeed: string, nonce: number) {
  const hmac = createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
  // Take first 8 bytes -> 64 bits
  const slice = hmac.substring(0, 16);
  const int = parseInt(slice, 16);
  return int / 0xffffffffffffffff;
}

export function randomFloat(stream: RngStream = 'OUTCOME_RNG') {
  // Stream is a no-op for now but keeps API future-proof for independent seeds
  const bytes = randomBytes(8);
  const int = bytes.readBigUInt64BE();
  return Number(int) / Number(BigInt('0xFFFFFFFFFFFFFFFF'));
}

export function randomInt(max: number, stream: RngStream = 'OUTCOME_RNG') {
  return Math.floor(randomFloat(stream) * max);
}
