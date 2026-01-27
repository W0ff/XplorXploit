import { HexCoord, TileData } from '../types';

export const coordToKey = (q: number, r: number) => `${q},${r}`;

export const getHexDistance = (a: HexCoord, b: HexCoord) => {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
};

/**
 * Generates resource values using a precise weighted distribution.
 * Targets:
 * - 2.5% Rare Veins (45, 50)
 * - 5% Rich Veins (40)
 * - 10% High-Tier Standard (35)
 * - 82.5% Standard (5-30)
 */
const generateDistributedValue = (): number => {
  const roll = Math.random();

  // Tier 1: Rare Veins (2.5%)
  if (roll < 0.025) {
    const rareValues = [45, 50];
    return rareValues[Math.floor(Math.random() * rareValues.length)];
  } 
  
  // Tier 2: Rich Veins (5%)
  if (roll < 0.075) { // 0.025 + 0.05
    return 40;
  }

  // Tier 3: High-Tier Standard (10%)
  if (roll < 0.175) { // 0.075 + 0.10
    return 35;
  }

  // Tier 4: Standard Distribution (82.5%) - Values 5 to 30
  const samples = 3;
  let sum = 0;
  for (let i = 0; i < samples; i++) {
    sum += Math.random();
  }
  
  // sum is [0, 3], centered is [-1.5, 1.5]
  const centered = sum - (samples / 2);
  
  // Spread values around 15
  const rawValue = centered * 14 + 15;
  
  // Round to nearest multiple of 5
  const rounded = Math.round(rawValue / 5) * 5;
  
  // Clamp standard tiles to 5-30
  return Math.max(5, Math.min(30, rounded));
};

export const generateGrid = (radius: number): Map<string, TileData> => {
  const grid = new Map<string, TileData>();
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      grid.set(coordToKey(q, r), {
        q,
        r,
        trueValue: generateDistributedValue(),
        revealed: false,
        minedCount: 0
      });
    }
  }
  return grid;
};

export const getNeighbors = (coord: HexCoord, grid: Map<string, TileData>): HexCoord[] => {
  const directions: HexCoord[] = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ];
  return directions
    .map(d => ({ q: coord.q + d.q, r: coord.r + d.r }))
    .filter(c => grid.has(coordToKey(c.q, c.r)));
};