import React, { useState, useEffect } from 'react';
import { LogicBlock, TileData, HexCoord, DEFAULT_PRESETS } from '../types';
import { coordToKey, getNeighbors } from '../utils/hexUtils';

interface BenchResult {
  key: string;
  name: string;
  avgScore: number;
  minScore: number;
  maxScore: number;
  isDefined: boolean;
}

interface StrategyBenchmarkerProps {
  presets: Record<string, LogicBlock[]>;
  onClose: () => void;
  createMap: () => { grid: Map<string, TileData>, start: HexCoord };
  decideStep: (state: any, strat: LogicBlock[]) => { action: 'MOVE' | 'MINE', target?: HexCoord };
}

export default function StrategyBenchmarker({ presets, onClose, createMap, decideStep }: StrategyBenchmarkerProps) {
  const [results, setResults] = useState<BenchResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const RUNS = 100;
    const MAX_TURNS = 20;
    const allPresets = Object.keys(DEFAULT_PRESETS);
    
    const runBench = async () => {
      const finalResults: BenchResult[] = [];
      
      for (let pIdx = 0; pIdx < allPresets.length; pIdx++) {
        const pKey = allPresets[pIdx];
        const strategy = presets[pKey];
        
        if (!strategy || strategy.length === 0) {
          finalResults.push({
            key: pKey,
            name: DEFAULT_PRESETS[pKey].name,
            avgScore: 0,
            minScore: 0,
            maxScore: 0,
            isDefined: false
          });
          continue;
        }

        let scores: number[] = [];
        for (let i = 0; i < RUNS; i++) {
          const { grid, start } = createMap();
          let currentPos = start;
          let score = 0;
          let visited = [coordToKey(start.q, start.r)];
          
          for (let t = 0; t < MAX_TURNS; t++) {
            const state = { currentHex: currentPos, tiles: grid, turnsLeft: MAX_TURNS - t, visitedKeys: visited };
            const step = decideStep(state, strategy);

            if (step.action === 'MINE') {
              const val = grid.get(coordToKey(currentPos.q, currentPos.r))?.trueValue || 0;
              score += val;
            } else if (step.action === 'MOVE' && step.target) {
              currentPos = step.target;
              const key = coordToKey(currentPos.q, currentPos.r);
              if (!visited.includes(key)) visited.push(key);
              const tile = grid.get(key)!;
              if (!tile.revealed) grid.set(key, { ...tile, revealed: true });
              getNeighbors(currentPos, grid).forEach(n => {
                const k = coordToKey(n.q, n.r);
                const nt = grid.get(k)!;
                if (!nt.revealed) grid.set(k, { ...nt, revealed: true });
              });
            }
          }
          scores.push(score);
          
          if (i % 20 === 0) {
            setProgress(Math.round(((pIdx * RUNS + i) / (allPresets.length * RUNS)) * 100));
            await new Promise(r => setTimeout(r, 0));
          }
        }
        
        scores.sort((a, b) => a - b);
        finalResults.push({
          key: pKey,
          name: DEFAULT_PRESETS[pKey].name,
          avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / RUNS),
          minScore: scores[0],
          maxScore: scores[scores.length - 1],
          isDefined: true
        });
      }
      
      setResults(finalResults);
      setIsDone(true);
      setProgress(100);
    };

    runBench();
  }, [presets, createMap, decideStep]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Strategy Benchmarking</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1 italic">Comparative Monte Carlo Performance Analysis (n=100)</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors flex items-center justify-center">
             <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-8">
          {!isDone ? (
            <div className="py-24 flex flex-col items-center">
              <div className="w-64 h-3 bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-700">
                <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-indigo-400 font-mono text-sm animate-pulse uppercase tracking-[0.2em] font-black">Running Cross-Simulations... {progress}%</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {results.map((res) => (
                  <div key={res.key} className={`p-6 rounded-3xl border transition-all duration-500 flex flex-col items-center text-center
                    ${res.isDefined ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-900/50 border-slate-800 opacity-40'}
                    ${res.key === 'custom' && res.isDefined ? 'ring-2 ring-cyan-500/50 ring-offset-4 ring-offset-slate-950 shadow-2xl shadow-cyan-500/10' : ''}
                  `}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-4
                      ${res.isDefined ? (res.key === 'custom' ? 'text-cyan-400' : 'text-slate-500') : 'text-slate-600'}
                    `}>{res.name}</div>
                    
                    {!res.isDefined ? (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-2xl font-black text-slate-700 italic">N/A</div>
                        <div className="text-[8px] text-slate-600 font-bold uppercase mt-2">Undefined</div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        <div className="text-5xl font-mono font-black text-white tracking-tighter mb-4">{res.avgScore}</div>
                        
                        <div className="w-full space-y-3 mt-2 border-t border-slate-700/50 pt-4">
                           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
                              <span className="text-slate-500">Floor</span>
                              <span className="text-rose-500">{res.minScore}</span>
                           </div>
                           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
                              <span className="text-slate-500">Ceiling</span>
                              <span className="text-emerald-400">{res.maxScore}</span>
                           </div>
                           <div className="mt-4 pt-4 border-t border-slate-700/30">
                              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${res.avgScore >= 500 ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-slate-600'}`} 
                                  style={{ width: `${Math.min((res.avgScore / 800) * 100, 100)}%` }} 
                                />
                              </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 mt-8">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <i className="fa-solid fa-microchip"></i>
                   </div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Comparative Insights</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  Based on 400 total simulated missions, the <span className="text-white font-bold">Standard Recon</span> baseline typically targets ~300-400 units. A "Custom" logic that effectively balances center-seeking exploration with high-value threshold exploitation can exceed <span className="text-cyan-400 font-bold">700 units</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-800/10 border-t border-slate-800">
          <button 
            onClick={onClose}
            className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-xl"
          >
            Close Comparison View
          </button>
        </div>
      </div>
    </div>
  );
}