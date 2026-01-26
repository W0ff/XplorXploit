
import React, { useState, useEffect, useMemo } from 'react';
import { LogicBlock, TileData, HexCoord } from '../types';
import { coordToKey, getNeighbors, getHexDistance } from '../utils/hexUtils';

interface SimulationResult {
  score: number;
  mines: number;
  moves: number;
}

interface StrategySimulatorProps {
  strategy: LogicBlock[];
  onClose: () => void;
  createMap: () => { grid: Map<string, TileData>, start: HexCoord };
  decideStep: (state: any, strat: LogicBlock[]) => { action: 'MOVE' | 'MINE', target?: HexCoord };
}

const StrategySimulator: React.FC<StrategySimulatorProps> = ({ strategy, onClose, createMap, decideStep }) => {
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const RUNS = 100;
    const MAX_TURNS = 20;
    const allResults: SimulationResult[] = [];

    const runSim = async () => {
      // Chunking simulation to allow UI progress updates
      for (let i = 0; i < RUNS; i++) {
        const { grid, start } = createMap();
        let currentPos = start;
        let score = 0;
        let mines = 0;
        let moves = 0;
        let visited = [coordToKey(start.q, start.r)];
        
        // Internal loop for one game
        for (let t = 0; t < MAX_TURNS; t++) {
          const state = { currentHex: currentPos, tiles: grid, turnsLeft: MAX_TURNS - t, visitedKeys: visited };
          const step = decideStep(state, strategy);

          if (step.action === 'MINE') {
            const val = grid.get(coordToKey(currentPos.q, currentPos.r))?.trueValue || 0;
            score += val;
            mines++;
          } else if (step.action === 'MOVE' && step.target) {
            currentPos = step.target;
            moves++;
            const key = coordToKey(currentPos.q, currentPos.r);
            if (!visited.includes(key)) visited.push(key);
            
            // Auto-reveal logic (re-implementing getRevealedGrid logic for speed)
            const tile = grid.get(key)!;
            if (!tile.revealed) grid.set(key, { ...tile, revealed: true });
            getNeighbors(currentPos, grid).forEach(n => {
              const k = coordToKey(n.q, n.r);
              const nt = grid.get(k)!;
              if (!nt.revealed) grid.set(k, { ...nt, revealed: true });
            });
          }
        }
        allResults.push({ score, mines, moves });
        
        if (i % 5 === 0) {
          setProgress(Math.round(((i + 1) / RUNS) * 100));
          await new Promise(r => setTimeout(r, 10)); // Yield to main thread
        }
      }
      setResults(allResults);
      setIsDone(true);
      setProgress(100);
    };

    runSim();
  }, [strategy, createMap, decideStep]);

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const scores = results.map(r => r.score).sort((a, b) => a - b);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / results.length);
    const min = scores[0];
    const max = scores[scores.length - 1];
    
    // Efficiency groups - Recalibrated thresholds
    const diamondTier = results.filter(r => r.score >= 700).length;
    const richTier = results.filter(r => r.score >= 500 && r.score < 700).length;
    const copperTier = results.filter(r => r.score >= 300 && r.score < 500).length;
    const standardTier = results.filter(r => r.score < 300).length;

    return { avg, min, max, diamondTier, richTier, copperTier, standardTier };
  }, [results]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Strategy Stress-Test</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1 italic">Monte Carlo Simulation: 100 Independent Runs</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors flex items-center justify-center">
             <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-8">
          {!isDone ? (
            <div className="py-12 flex flex-col items-center">
              <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-700">
                <div className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-cyan-400 font-mono text-sm animate-pulse uppercase tracking-[0.2em] font-black">Analyzing Probabilities... {progress}%</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-700">
              {/* Outcome Dots Visualization */}
              <div className="space-y-2">
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score Distribution Density</span>
                    <div className="flex gap-4 text-[8px] font-black uppercase tracking-tighter">
                       <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sky-300"></div> Diamond (700+)</span>
                       <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Rich (500+)</span>
                    </div>
                 </div>
                 <div className="bg-slate-800/30 p-4 rounded-3xl border border-slate-800/50 flex flex-wrap gap-1.5 justify-center min-h-[120px] items-center">
                    {results.sort((a,b) => a.score - b.score).map((r, i) => (
                      <div 
                        key={i} 
                        className={`w-3 h-3 rounded-full shadow-sm transition-all duration-500 hover:scale-150 cursor-crosshair
                          ${r.score >= 700 ? 'bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.6)]' : 
                            r.score >= 500 ? 'bg-amber-400' : 
                            r.score >= 300 ? 'bg-orange-500' : 'bg-slate-600'}
                        `}
                        title={`Score: ${r.score}`}
                      />
                    ))}
                 </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                 <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/30 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Mean Score</div>
                    <div className={`text-4xl font-mono font-black ${stats && stats.avg >= 500 ? 'text-cyan-400' : 'text-slate-400'}`}>{stats?.avg}</div>
                 </div>
                 <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/30 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Lowest Case</div>
                    <div className="text-4xl font-mono text-rose-500/80 font-black">{stats?.min}</div>
                 </div>
                 <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/30 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Best Case</div>
                    <div className="text-4xl font-mono text-sky-300 font-black">{stats?.max}</div>
                 </div>
              </div>

              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Strategic Robustness Report</h4>
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Yield Consistency</span>
                      <span className="text-xs font-bold text-white uppercase">{stats && stats.diamondTier + stats.richTier}% High Yield Ratio</span>
                   </div>
                   <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="bg-sky-300" style={{ width: `${stats?.diamondTier}%` }} />
                      <div className="bg-amber-400" style={{ width: `${stats?.richTier}%` }} />
                      <div className="bg-orange-500" style={{ width: `${stats?.copperTier}%` }} />
                      <div className="bg-slate-600" style={{ width: `${stats?.standardTier}%` }} />
                   </div>
                   <p className="text-[10px] text-slate-500 italic text-center pt-2">
                      In 100 missions, your strategy averaged <span className={`${stats && stats.avg >= 500 ? 'text-emerald-400' : 'text-slate-300'} font-bold`}>{stats?.avg} units</span>. Outcomes above <span className="text-amber-400 font-bold">500</span> are considered elite performance.
                   </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-800/10 border-t border-slate-800">
          <button 
            onClick={onClose}
            className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-xl"
          >
            Acknowledge Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategySimulator;
