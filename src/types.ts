
export interface HexCoord {
  q: number;
  r: number;
}

export interface TileData extends HexCoord {
  trueValue: number;
  revealed: boolean;
  minedCount: number;
}

export interface MiningEffect {
  id: string;
  val: number;
  q: number;
  r: number;
  offset: { x: number, y: number };
}

export type ActionType = 'SEEK_FRONTIER' | 'MOVE_HIGHEST_KNOWN' | 'MINE_CURRENT';
export type ConditionType = 'ALWAYS' | 'CURRENT_VALUE' | 'TURNS_REMAINING' | 'HIGHEST_VALUE';
export type OperatorType = '<=' | '>=' | '=';

export interface LogicBlock {
  id: string;
  condition: ConditionType;
  operator: OperatorType;
  threshold: number;
  action: ActionType;
  compareWithHighest?: boolean;
}

export interface EvaluationResult {
  ruleId: string;
  met: boolean;
  chosen: boolean;
}

export interface GameState {
  currentHex: HexCoord;
  startHex: HexCoord;
  tiles: Map<string, TileData>;
  turnsLeft: number;
  totalOre: number;
  gameStatus: 'IDLE' | 'PLAYING' | 'AUTO_PILOT' | 'FINISHED';
  revealedCount: number;
  visitedKeys: string[];
}

export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

export const DEFAULT_PRESETS: Record<string, { name: string, description: string, blocks: LogicBlock[] }> = {
  recon: {
    name: "Standard Recon",
    description: "Move towards the center for 3 turns, then exploit the best known tile.",
    blocks: [
      { id: 'p1-1', condition: 'TURNS_REMAINING', operator: '>=', threshold: 17, action: 'SEEK_FRONTIER' },
      { id: 'p1-2', condition: 'ALWAYS', operator: '>=', threshold: 0, action: 'MOVE_HIGHEST_KNOWN' }
    ]
  },
  value_hunter: {
    name: "Jackpot Hunter",
    description: "Search until finding a 40+ tile, then exploit. Uses center-seeking to prioritize heart of the sector.",
    blocks: [
      { id: 'p2-1', condition: 'HIGHEST_VALUE', operator: '>=', threshold: 40, action: 'MOVE_HIGHEST_KNOWN' },
      { id: 'p2-2', condition: 'ALWAYS', operator: '>=', threshold: 0, action: 'SEEK_FRONTIER' }
    ]
  },
  custom: {
    name: "Custom",
    description: "Start from scratch. Build your own unique logic sequence here.",
    blocks: []
  },
  homebody: {
    name: "Homebody",
    description: "Moves exactly once on Turn 1 to the best nearby tile, then exploits to the end.",
    blocks: [
      { id: 'p4-1', condition: 'TURNS_REMAINING', operator: '=', threshold: 20, action: 'MOVE_HIGHEST_KNOWN' },
      { id: 'p4-2', condition: 'ALWAYS', operator: '>=', threshold: 0, action: 'MINE_CURRENT' }
    ]
  }
};