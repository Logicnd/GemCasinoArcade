import { randomInt } from './rng-service';

export const MINES_GRID_SIZE = 25;

export interface MinesState {
  bombs: number[];
  revealed: number[];
  refId: string;
}

export function generateBombs(minesCount: number, gridSize = MINES_GRID_SIZE) {
  const bombs = new Set<number>();
  while (bombs.size < minesCount) {
    bombs.add(randomInt(gridSize));
  }
  return Array.from(bombs.values());
}

export function minesMultiplier(revealedSafe: number, minesCount: number, gridSize = MINES_GRID_SIZE) {
  if (revealedSafe <= 0) return 1;
  const base = gridSize / (gridSize - minesCount);
  const houseEdge = 0.98;
  const value = Math.pow(base, revealedSafe) * houseEdge;
  return Number(value.toFixed(4));
}

export function revealTile(state: MinesState, tileIndex: number) {
  const hitMine = state.bombs.includes(tileIndex);
  const already = state.revealed.includes(tileIndex);
  if (already) return { hitMine: false, alreadyRevealed: true, state };

  if (!hitMine) {
    state.revealed.push(tileIndex);
  }

  return { hitMine, alreadyRevealed: false, state };
}
