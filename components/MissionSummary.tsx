
import React, { useMemo } from 'react';
import { GameState, HexCoord } from '../types';
import { coordToKey, getNeighbors, getHexDistance } from '../utils/hexUtils';

interface MissionSummaryProps {
  gameState: GameState;
  onClose: () => void;
  onRestart: () => void;
}

const MissionSummary: React.FC<MissionSummaryProps> = ({ gameState, onClose, onRestart }) => {
  const stats = useMemo(() => {
    const MAX_TURNS = 20;

    // 1. Calculate User Stats
    let userMines = 0;
    gameState.tiles.forEach(t => {
      userMines += t.minedCount;
    });
    const turnsSpent = MAX_TURNS - gameState.turnsLeft;
    const userMoves = turnsSpent - userMines;
    const userAvgYield = userMines > 0 ? Math.round(gameState.totalOre / userMines) : 0;

    // 2. Simulate Epsilon-Greedy Agent (15% Exploration)
    const SIM_RUNS = 100;
    let totalSimScore = 0;
    let totalMoves = 0;
    let totalMines = 0;
    let totalMinedValue = 0;

    for (let i = 0; i < SIM_RUNS; i++) {
      let score = 0;
      let currentPos = gameState.startHex;
      let simMoves = 0;
      let simMines = 0;
      const knownKeys = new Set<string>();
      const visitedKeys = new Set<string>();
      
      const addKnowledge = (pos: HexCoord) => {
        const key = coordToKey(pos.q, pos.r);
        visitedKeys.add(key);
        knownKeys.add(key);
        getNeighbors(pos, gameState.tiles).forEach(n => knownKeys.add(coordToKey(n.q, n.r)));
      };

      addKnowledge(currentPos);

      for (let t = 0; t < MAX_TURNS; t++) {
        // Tuned Epsilon: 0.15 is ideal for 20 turns with 17.5% jackpot density
        const epsilon = 0.15;
        const isExploring = Math.random() < epsilon;

        // Find best known
        let bestVal = -1;
        let bestPos = currentPos;
        knownKeys.forEach(key => {
          const val = gameState.tiles.get(key)?.trueValue || 0;
          if (val > bestVal) {
            bestVal = val;
            const [bq, br] = key.split(',').map(Number);
            bestPos = { q: bq, r: br };
          }
        });

        if (isExploring) {
          // Smart Explore: Prefer unvisited tiles to move away from start
          const neighbors = getNeighbors(currentPos, gameState.tiles);
          const unvisited = neighbors.filter(n => !visitedKeys.has(coordToKey(n.q, n.r)));
          const target = unvisited.length > 0 
            ? unvisited[Math.floor(Math.random() * unvisited.length)] 
            : neighbors[Math.floor(Math.random() * neighbors.length)];
          
          currentPos = target;
          simMoves++;
          addKnowledge(currentPos);
        } else {
          // Greedy Choice
          if (currentPos.q === bestPos.q && currentPos.r === bestPos.r) {
            // Mine
            const val = gameState.tiles.get(coordToKey(currentPos.q, currentPos.r))?.trueValue || 0;
            score += val;
            totalMinedValue += val;
            simMines++;
          } else {
            // Move towards best known using shortest path
            const neighbors = getNeighbors(currentPos, gameState.tiles);
            let minD = Infinity;
            neighbors.forEach(n => {
              const d = getHexDistance(n, bestPos);
              if (d < minD) minD = d;
            });
            const bestNeighbors = neighbors.filter(n => getHexDistance(n, bestPos) === minD);
            currentPos = bestNeighbors[Math.floor(Math.random() * bestNeighbors.length)];
            simMoves++;
            addKnowledge(currentPos);
          }
        }
      }
      totalSimScore += score;
      totalMoves += simMoves;
      totalMines += simMines;
    }

    const baselineScore = Math.round(totalSimScore / SIM_RUNS);
    const avgMoves = Math.round(totalMoves / SIM_RUNS);
    const avgMines = Math.round(totalMines / SIM_RUNS);
    const avgMinedVal = totalMines > 0 ? Math.round(totalMinedValue / totalMines) : 0;
    
    const scoreDiff = gameState.totalOre - baselineScore;
    const performance = Math.round((gameState.totalOre / (baselineScore || 1)) * 100);
    
    return { 
      baselineScore, 
      scoreDiff, 
      performance, 
      avgMoves,
      avgMines,
      avgMinedVal,
      userMoves,
      userMines,
      userAvgYield
    };
  }, [gameState.tiles, gameState.startHex, gameState.totalOre, gameState.turnsLeft]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-b from-slate-800/50 to-transparent p-8 text-center">
          <div className="inline-flex w-16 h-16 bg-amber-500 rounded-full items-center justify-center text-slate-900 text-3xl mb-4 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            <i className="fa-solid fa-flag-checkered"></i>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">Mission Complete</h2>
          <p className="text-slate-400 text-sm font-medium tracking-wide italic">Comparing your strategy to the Epsilon-Greedy Baseline</p>
        </div>

        <div className="px-8 pb-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Your Total Ore</div>
              <div className="text-3xl font-mono text-cyan-400">{gameState.totalOre}</div>
            </div>
            <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">AI Baseline</div>
              <div className="text-3xl font-mono text-slate-400">{stats.baselineScore}</div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy Breakdown</span>
              <div className="flex gap-4">
                <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Xplore</span>
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Xploit</span>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* User Row */}
              <div className="grid grid-cols-12 items-center gap-4">
                <div className="col-span-3 text-[10px] font-black text-white uppercase tracking-tighter">Your Mission</div>
                <div className="col-span-9 flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 h-8 rounded-lg overflow-hidden flex font-mono text-[10px] font-bold">
                    <div 
                      className="bg-cyan-500/80 flex items-center justify-center text-white border-r border-slate-900/50 transition-all duration-1000" 
                      style={{ width: `${(stats.userMoves / 20) * 100}%` }}
                    >
                      {stats.userMoves > 0 && stats.userMoves}
                    </div>
                    <div 
                      className="bg-amber-500/80 flex items-center justify-center text-slate-900 transition-all duration-1000" 
                      style={{ width: `${(stats.userMines / 20) * 100}%` }}
                    >
                      {stats.userMines > 0 && stats.userMines}
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-emerald-400 w-8">avg{stats.userAvgYield}</div>
                </div>
              </div>

              {/* AI Row */}
              <div className="grid grid-cols-12 items-center gap-4 opacity-60">
                <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter">AI Baseline</div>
                <div className="col-span-9 flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 h-8 rounded-lg overflow-hidden flex font-mono text-[10px] font-bold">
                    <div 
                      className="bg-slate-600 flex items-center justify-center text-white border-r border-slate-900/50" 
                      style={{ width: `${(stats.avgMoves / 20) * 100}%` }}
                    >
                      {stats.avgMoves}
                    </div>
                    <div 
                      className="bg-slate-500 flex items-center justify-center text-slate-900" 
                      style={{ width: `${(stats.avgMines / 20) * 100}%` }}
                    >
                      {stats.avgMines}
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-slate-500 w-8">avg{stats.avgMinedVal}</div>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-4 text-[10px] text-slate-500 text-center italic leading-relaxed border-t border-slate-800 pt-3">
              You spent <span className="text-white font-bold">{stats.userMoves} turns</span> traveling and <span className="text-white font-bold">{stats.userMines} turns</span> mining. Your average extraction yield was <span className="text-emerald-400 font-bold">{stats.userAvgYield} units</span> per turn.
            </div>
          </div>

          <div className={`${stats.scoreDiff >= 0 ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'} border rounded-3xl p-6`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className={`text-lg font-bold uppercase tracking-tighter ${stats.scoreDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stats.scoreDiff >= 0 ? 'Superior Logic' : 'Agent Performance Gap'}
                </h3>
                <p className="text-xs text-slate-500">Net Variance: {stats.scoreDiff > 0 ? '+' : ''}{stats.scoreDiff} Units</p>
              </div>
              <div className={`text-4xl font-mono ${stats.scoreDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.performance}%
              </div>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${stats.scoreDiff >= 0 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} 
                style={{ width: `${Math.min(stats.performance, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onRestart}
              className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-rotate-right"></i> Deploy New Mission
            </button>
            <button 
              onClick={onClose}
              className="w-full text-slate-500 font-bold py-2 uppercase tracking-widest text-[10px] hover:text-white transition-colors"
            >
              Inspect Sector Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionSummary;
