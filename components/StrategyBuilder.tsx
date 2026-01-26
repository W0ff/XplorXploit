import React from 'react';
import { LogicBlock, ActionType, ConditionType, OperatorType, EvaluationResult, DEFAULT_PRESETS } from '../types';

interface StrategyBuilderProps {
  strategy: LogicBlock[];
  setStrategy: React.Dispatch<React.SetStateAction<LogicBlock[]>>;
  activePresetKey: string;
  setActivePresetKey: (key: string) => void;
  onRunMission: () => void;
  onOpenSim: () => void;
  onOpenBench: () => void;
  onResetPresets: () => void;
  isAutoRunning: boolean;
  evaluationResults: Record<string, EvaluationResult>;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ 
  strategy, 
  setStrategy, 
  activePresetKey,
  setActivePresetKey,
  onRunMission, 
  onOpenSim,
  onOpenBench,
  onResetPresets,
  isAutoRunning,
  evaluationResults
}) => {
  const addBlock = () => {
    const newBlock: LogicBlock = {
      id: Math.random().toString(36).substr(2, 9),
      condition: 'ALWAYS',
      operator: '<=',
      threshold: 15,
      action: 'MINE_CURRENT'
    };
    setStrategy(prev => [...prev, newBlock]);
  };

  const removeBlock = (id: string) => {
    setStrategy(prev => prev.filter(b => b.id !== id));
  };

  const updateBlock = (id: string, updates: Partial<LogicBlock>) => {
    setStrategy(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newStrategy = [...strategy];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < strategy.length) {
      [newStrategy[index], newStrategy[targetIndex]] = [newStrategy[targetIndex], newStrategy[index]];
      setStrategy(newStrategy);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Strategy Presets</h3>
          <button 
            onClick={onResetPresets}
            disabled={isAutoRunning}
            className="text-[9px] text-slate-500 hover:text-rose-400 uppercase font-black tracking-widest transition-colors flex items-center gap-1"
          >
            <i className="fa-solid fa-undo text-[8px]"></i> Reset Baselines
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(DEFAULT_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              disabled={isAutoRunning}
              onClick={() => setActivePresetKey(key)}
              className={`group text-left p-3 rounded-xl border transition-all disabled:opacity-50
                ${activePresetKey === key 
                  ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-500 hover:bg-slate-800'}
              `}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-black uppercase tracking-tight ${activePresetKey === key ? 'text-cyan-400' : 'text-white'}`}>{preset.name}</span>
                <i className={`fa-solid fa-bolt-lightning text-[10px] ${activePresetKey === key ? 'text-cyan-400' : 'text-slate-600 group-hover:text-cyan-400'}`}></i>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight line-clamp-2">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mt-2">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Custom Rule Sequence</h3>
        <button 
          onClick={addBlock}
          disabled={isAutoRunning}
          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 px-3 rounded-lg border border-slate-700 transition-colors disabled:opacity-50 uppercase tracking-widest"
        >
          <i className="fa-solid fa-plus mr-1"></i> Add
        </button>
      </div>

      <div className="flex-1 space-y-4">
        {strategy.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-800/50">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-3 text-xl">
              <i className="fa-solid fa-terminal"></i>
            </div>
            <p className="text-slate-500 text-[11px] px-8 leading-relaxed">Sequence empty.</p>
          </div>
        ) : (
          strategy.map((block, index) => {
            const evalResult = evaluationResults[block.id];
            const isChosen = evalResult?.chosen;
            const isMet = evalResult?.met;
            const stepValue = block.condition === 'TURNS_REMAINING' ? 1 : 5;

            return (
              <div 
                key={block.id} 
                className={`rounded-2xl border transition-all duration-300 overflow-hidden
                  ${isAutoRunning && isChosen ? 'bg-cyan-900/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]' : 'bg-slate-800/50 border-slate-700/50'}
                  ${isAutoRunning && !isChosen && isMet ? 'bg-emerald-900/20 border-emerald-500/30' : ''}
                  ${isAutoRunning && !isMet ? 'opacity-40' : ''}
                `}
              >
                <div className={`px-4 py-2 flex justify-between items-center border-b transition-colors
                  ${isAutoRunning && isChosen ? 'bg-cyan-800/50 border-cyan-400/30' : 'bg-slate-800 border-slate-700'}
                `}>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Rule {index + 1}</span>
                    {isAutoRunning && isChosen && <span className="text-[8px] font-black text-cyan-400 uppercase animate-pulse">EXECUTING</span>}
                  </div>
                  <div className="flex gap-2">
                    {!isAutoRunning && (
                      <>
                        <button onClick={() => moveBlock(index, 'up')} className="text-slate-500 hover:text-white text-xs"><i className="fa-solid fa-chevron-up"></i></button>
                        <button onClick={() => moveBlock(index, 'down')} className="text-slate-500 hover:text-white text-xs"><i className="fa-solid fa-chevron-down"></i></button>
                        <button onClick={() => removeBlock(block.id)} className="text-red-400/40 hover:text-red-400 ml-1 text-xs"><i className="fa-solid fa-xmark"></i></button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="p-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-bold text-slate-500 uppercase tracking-tighter">IF</span>
                    <select 
                      disabled={isAutoRunning}
                      value={block.condition} 
                      onChange={(e) => updateBlock(block.id, { condition: e.target.value as ConditionType })}
                      className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 outline-none focus:border-cyan-500 disabled:bg-slate-950/50"
                    >
                      <option value="ALWAYS">Always</option>
                      <option value="CURRENT_VALUE">Current Tile Value</option>
                      <option value="TURNS_REMAINING">Turns Remaining</option>
                      <option value="HIGHEST_VALUE">Highest Value Found</option>
                    </select>

                    {block.condition !== 'ALWAYS' && (
                      <>
                        <select
                          disabled={isAutoRunning}
                          value={block.operator}
                          onChange={(e) => updateBlock(block.id, { operator: e.target.value as OperatorType })}
                          className="bg-slate-900 border border-slate-700 text-cyan-400 rounded-lg px-1.5 py-1 font-black outline-none focus:border-cyan-500 disabled:bg-slate-950/50 min-w-[3rem]"
                        >
                          <option value="<=">&le;</option>
                          <option value=">=">&ge;</option>
                          <option value="=">=</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <input 
                            disabled={isAutoRunning || block.compareWithHighest}
                            type="number" 
                            step={stepValue}
                            value={block.threshold} 
                            onChange={(e) => updateBlock(block.id, { threshold: parseInt(e.target.value) || 0 })}
                            className={`w-14 bg-slate-900 border border-slate-700 text-cyan-400 rounded-lg px-1 py-1 text-center font-bold disabled:bg-slate-950/50 ${block.compareWithHighest ? 'opacity-30' : ''}`}
                          />
                          {block.condition === 'CURRENT_VALUE' && (
                            <div className={`flex items-center gap-2 px-2 py-1 bg-slate-900/50 border rounded-lg ${block.compareWithHighest ? 'border-cyan-500/50 text-cyan-400' : 'border-slate-800 text-slate-500'}`}>
                              <input id={`comp-best-${block.id}`} type="checkbox" disabled={isAutoRunning} checked={block.compareWithHighest || false} onChange={(e) => updateBlock(block.id, { compareWithHighest: e.target.checked })} className="w-3 h-3 accent-cyan-500 cursor-pointer" />
                              <label htmlFor={`comp-best-${block.id}`} className="text-[9px] font-black uppercase tracking-tight cursor-pointer">Highest</label>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-slate-500 uppercase tracking-tighter">DO</span>
                    <select 
                      disabled={isAutoRunning}
                      value={block.action} 
                      onChange={(e) => updateBlock(block.id, { action: e.target.value as ActionType })}
                      className="flex-1 bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 rounded-lg px-2 py-1.5 font-bold outline-none disabled:bg-slate-950/20"
                    >
                      <option value="MINE_CURRENT">Mine Current Tile</option>
                      <option value="SEEK_FRONTIER">Seek Frontier</option>
                      <option value="MOVE_HIGHEST_KNOWN">Move to Highest Known</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
        <button 
          onClick={onRunMission}
          disabled={isAutoRunning || strategy.length === 0}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all
            ${isAutoRunning ? 'bg-slate-800 text-slate-600' : 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg'}
          `}
        >
          {isAutoRunning ? 'In Progress...' : 'Execute Mission'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onOpenSim}
            disabled={isAutoRunning || strategy.length === 0}
            className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] uppercase font-black tracking-widest transition-all border border-slate-700/50"
          >
            <i className="fa-solid fa-chart-line mr-2"></i> Simulate
          </button>
          <button 
            onClick={onOpenBench}
            disabled={isAutoRunning}
            className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] uppercase font-black tracking-widest transition-all border border-slate-700/50"
          >
            <i className="fa-solid fa-layer-group mr-2"></i> Compare All
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilder;