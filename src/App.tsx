
import React, { useState, useEffect, useCallback } from 'react';
import { HexCoord, TileData, LogicBlock, GameState, OperatorType, EvaluationResult, DEFAULT_PRESETS } from './types';
import { generateGrid, coordToKey, getNeighbors, getHexDistance } from './utils/hexUtils';
import HexGrid from './components/HexGrid';
import ManualControls from './components/ManualControls';
import StrategyBuilder from './components/StrategyBuilder';
import MissionSummary from './components/MissionSummary';
import LearningPopup from './components/LearningPopup';
import StrategySimulator from './components/StrategySimulator';
import StrategyBenchmarker from './components/StrategyBenchmarker';

const MAX_TURNS = 20;
const INITIAL_RADIUS = 4;

const App: React.FC = () => {
  const createMap = useCallback(() => {
    const initialGrid = generateGrid(INITIAL_RADIUS);
    const corners: HexCoord[] = [
      { q: INITIAL_RADIUS, r: 0 }, { q: 0, r: INITIAL_RADIUS }, { q: -INITIAL_RADIUS, r: INITIAL_RADIUS },
      { q: -INITIAL_RADIUS, r: 0 }, { q: 0, r: -INITIAL_RADIUS }, { q: INITIAL_RADIUS, r: -INITIAL_RADIUS }
    ];
    const startHex = corners[Math.floor(Math.random() * corners.length)];
    const startKey = coordToKey(startHex.q, startHex.r);
    const startTile = initialGrid.get(startKey)!;
    initialGrid.set(startKey, { ...startTile, trueValue: 10, revealed: true });
    getNeighbors(startHex, initialGrid).forEach(n => {
      const k = coordToKey(n.q, n.r);
      const t = initialGrid.get(k)!;
      initialGrid.set(k, { ...t, revealed: true });
    });
    return { grid: initialGrid, start: startHex };
  }, []);

  const initializeGame = useCallback(() => {
    const { grid, start } = createMap();
    return {
      currentHex: start,
      startHex: start,
      tiles: grid,
      turnsLeft: MAX_TURNS,
      totalOre: 0,
      gameStatus: 'IDLE' as const,
      revealedCount: 1 + getNeighbors(start, grid).length,
      visitedKeys: [coordToKey(start.q, start.r)]
    };
  }, [createMap]);

  // Strategy and Preset State
  const [presets, setPresets] = useState<Record<string, LogicBlock[]>>(() => {
    try {
      const saved = localStorage.getItem('xplore_presets');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load presets from local storage", e);
    }
    // Fix: cast v to any to avoid "Property 'blocks' does not exist on type 'unknown'" error
    return Object.fromEntries(Object.entries(DEFAULT_PRESETS).map(([k, v]) => [k, (v as any).blocks]));
  });
  const [activePresetKey, setActivePresetKey] = useState<string>('recon');
  const strategy = presets[activePresetKey] || [];

  const setStrategy = useCallback((updater: React.SetStateAction<LogicBlock[]>) => {
    setPresets(prev => {
      const currentStrat = prev[activePresetKey] || [];
      const newStrategy = typeof updater === 'function' ? updater(currentStrat) : updater;
      const next = { ...prev, [activePresetKey]: newStrategy };
      localStorage.setItem('xplore_presets', JSON.stringify(next));
      return next;
    });
  }, [activePresetKey]);

  const resetPresets = () => {
    // Fix: cast v to any to avoid "Property 'blocks' does not exist on type 'unknown'" error
    const freshPresets = Object.fromEntries(Object.entries(DEFAULT_PRESETS).map(([k, v]) => [k, (v as any).blocks]));
    setPresets(freshPresets);
    localStorage.setItem('xplore_presets', JSON.stringify(freshPresets));
  };

  const [gameState, setGameState] = useState<GameState>(initializeGame);
  const [showSummary, setShowSummary] = useState(false);
  const [showLearning, setShowLearning] = useState(true);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showBenchmarker, setShowBenchmarker] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'strategy'>('manual');
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<Record<string, EvaluationResult>>({});

  const getRevealedGrid = (pos: HexCoord, currentGrid: Map<string, TileData>) => {
    const nextGrid = new Map(currentGrid);
    let revealedCount = 0;
    const centerKey = coordToKey(pos.q, pos.r);
    const centerTile = nextGrid.get(centerKey);
    if (centerTile && !centerTile.revealed) {
      nextGrid.set(centerKey, { ...centerTile, revealed: true });
      revealedCount++;
    }
    getNeighbors(pos, nextGrid).forEach(n => {
      const k = coordToKey(n.q, n.r);
      const t = nextGrid.get(k);
      if (t && !t.revealed) {
        nextGrid.set(k, { ...t, revealed: true });
        revealedCount++;
      }
    });
    return { nextGrid, revealedCount };
  };

  const handleMove = (target: HexCoord) => {
    if (gameState.turnsLeft <= 0 || gameState.gameStatus === 'FINISHED') return;
    setGameState(prev => {
      const { nextGrid, revealedCount } = getRevealedGrid(target, prev.tiles);
      const nextTurns = prev.turnsLeft - 1;
      return {
        ...prev,
        currentHex: target,
        tiles: nextGrid,
        turnsLeft: nextTurns,
        gameStatus: nextTurns === 0 ? 'FINISHED' : 'PLAYING',
        revealedCount: prev.revealedCount + revealedCount,
        visitedKeys: prev.visitedKeys.includes(coordToKey(target.q, target.r)) ? prev.visitedKeys : [...prev.visitedKeys, coordToKey(target.q, target.r)]
      };
    });
  };

  const handleMine = () => {
    if (gameState.turnsLeft <= 0 || gameState.gameStatus === 'FINISHED') return;
    setGameState(prev => {
      const currentKey = coordToKey(prev.currentHex.q, prev.currentHex.r);
      const tile = prev.tiles.get(currentKey)!;
      const nextGrid = new Map(prev.tiles);
      nextGrid.set(currentKey, { ...tile, minedCount: tile.minedCount + 1 });
      const nextTurns = prev.turnsLeft - 1;
      return {
        ...prev,
        totalOre: prev.totalOre + tile.trueValue,
        tiles: nextGrid,
        turnsLeft: nextTurns,
        gameStatus: nextTurns === 0 ? 'FINISHED' : 'PLAYING'
      };
    });
  };

  const handleMineAll = () => {
    if (gameState.turnsLeft <= 0 || gameState.gameStatus === 'FINISHED') return;
    setGameState(prev => {
      const currentKey = coordToKey(prev.currentHex.q, prev.currentHex.r);
      const tile = prev.tiles.get(currentKey)!;
      const turnsToMine = prev.turnsLeft;
      const nextGrid = new Map(prev.tiles);
      nextGrid.set(currentKey, { ...tile, minedCount: tile.minedCount + turnsToMine });
      return {
        ...prev,
        totalOre: prev.totalOre + (tile.trueValue * turnsToMine),
        tiles: nextGrid,
        turnsLeft: 0,
        gameStatus: 'FINISHED'
      };
    });
  };

  const resetGame = () => {
    setGameState(initializeGame());
    setShowSummary(false);
    setIsAutoRunning(false);
    setEvaluationResults({});
  };

  const decideStep = useCallback((state: { currentHex: HexCoord, tiles: Map<string, TileData>, turnsLeft: number, visitedKeys: string[] }, strat: LogicBlock[]): { action: 'MOVE' | 'MINE', target?: HexCoord, results: Record<string, EvaluationResult> } => {
    const currentKey = coordToKey(state.currentHex.q, state.currentHex.r);
    const currentTile = state.tiles.get(currentKey)!;
    let highestKnownVal = -1;
    let highestKnownCoord = state.currentHex;

    state.tiles.forEach(t => {
      if (t.revealed && t.trueValue > highestKnownVal) {
        highestKnownVal = t.trueValue;
        highestKnownCoord = { q: t.q, r: t.r };
      }
    });

    const evaluateCondition = (val: number, op: OperatorType, threshold: number): boolean => {
      if (op === '<=') return val <= threshold;
      if (op === '>=') return val >= threshold;
      return val === threshold;
    };

    const results: Record<string, EvaluationResult> = {};
    let chosenAction: { action: 'MOVE' | 'MINE', target?: HexCoord } | null = null;

    for (const block of strat) {
      let conditionMet = false;
      const threshold = block.compareWithHighest ? highestKnownVal : block.threshold;
      switch (block.condition) {
        case 'ALWAYS': conditionMet = true; break;
        case 'CURRENT_VALUE': conditionMet = evaluateCondition(currentTile.trueValue, block.operator, threshold); break;
        case 'TURNS_REMAINING': conditionMet = evaluateCondition(state.turnsLeft, block.operator, block.threshold); break;
        case 'HIGHEST_VALUE': conditionMet = evaluateCondition(highestKnownVal, block.operator, block.threshold); break;
      }
      const isChosen = conditionMet && chosenAction === null;
      results[block.id] = { ruleId: block.id, met: conditionMet, chosen: isChosen };
      if (isChosen) {
        if (block.action === 'MINE_CURRENT') {
          chosenAction = { action: 'MINE' };
        } else if (block.action === 'MOVE_HIGHEST_KNOWN') {
          if (state.currentHex.q === highestKnownCoord.q && state.currentHex.r === highestKnownCoord.r) {
            chosenAction = { action: 'MINE' };
          } else {
            const neighbors = getNeighbors(state.currentHex, state.tiles);
            neighbors.sort((a, b) => getHexDistance(a, highestKnownCoord) - getHexDistance(b, highestKnownCoord));
            chosenAction = { action: 'MOVE', target: neighbors[0] };
          }
        } else if (block.action === 'SEEK_FRONTIER') {
          const neighbors = getNeighbors(state.currentHex, state.tiles);
          const center = { q: 0, r: 0 };
          
          const neighborData = neighbors.map(n => ({
            coord: n,
            dist: getHexDistance(n, center),
            val: state.tiles.get(coordToKey(n.q, n.r))?.trueValue || 0
          }));
          
          neighborData.sort((a, b) => a.dist - b.dist);
          const candidates = neighborData.slice(0, 3);
          candidates.sort((a, b) => b.val - a.val);
          
          if (candidates.length > 0) {
            chosenAction = { action: 'MOVE', target: candidates[0].coord };
          } else {
            chosenAction = { action: 'MINE' };
          }
        }
      }
    }
    return { action: chosenAction?.action || 'MINE', target: chosenAction?.target, results };
  }, []);

  useEffect(() => {
    if (isAutoRunning && gameState.turnsLeft > 0 && gameState.gameStatus !== 'FINISHED') {
      const timer = setTimeout(() => {
        const step = decideStep(gameState, strategy);
        setEvaluationResults(step.results);
        if (step.action === 'MINE') handleMine();
        else if (step.action === 'MOVE' && step.target) handleMove(step.target);
      }, 500);
      return () => clearTimeout(timer);
    } else if (isAutoRunning && gameState.turnsLeft === 0) {
      setIsAutoRunning(false);
    }
  }, [isAutoRunning, gameState, strategy, decideStep]);

  useEffect(() => {
    if (gameState.turnsLeft === 0) setShowSummary(true);
  }, [gameState.turnsLeft]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <header className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-cyan-500 p-3 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/10">
            <i className="fa-solid fa-shuttle-space text-white text-3xl"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Xplore <span className="text-cyan-400">vs.</span> Xploit</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Multi-Armed Bandit Simulation v1.0</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900/90 px-8 py-4 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl flex flex-col items-center min-w-[160px]">
            <div className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Total Ore</div>
            <div className="text-4xl font-mono text-white leading-none font-black tracking-tighter">{gameState.totalOre}</div>
          </div>
          <div className="bg-slate-900/90 px-8 py-4 rounded-3xl border border-slate-700/50 backdrop-blur-xl shadow-xl flex flex-col items-center min-w-[160px]">
            <div className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Turns Left</div>
            <div className={`text-4xl font-mono leading-none font-black tracking-tighter transition-colors duration-500 ${gameState.turnsLeft < 6 ? 'text-rose-500' : gameState.turnsLeft < 12 ? 'text-amber-400' : 'text-emerald-400'}`}>{gameState.turnsLeft}</div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-slate-900 rounded-[2.5rem] border-2 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[400px] md:min-h-[550px] lg:min-h-[600px] flex items-center justify-center p-4">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            <HexGrid tiles={gameState.tiles} currentHex={gameState.currentHex} onHexClick={activeTab === 'manual' ? handleMove : undefined} />
          </div>
          <div className="bg-slate-800/20 p-4 rounded-2xl border border-slate-700/30 flex justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-cyan-500"></div> Ship</span>
              <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-slate-800"></div> Fog</span>
            </div>
            <button onClick={resetGame} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] uppercase tracking-widest font-black text-slate-400 hover:text-white transition-all border border-slate-700/50 shadow-lg">Reset Sector</button>
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 rounded-[2rem] border-2 border-slate-800 shadow-xl overflow-hidden flex flex-col h-[550px] lg:h-[600px]">
            <div className="flex border-b-2 border-slate-800 bg-slate-800/30">
              {['manual', 'strategy'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-800/60 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500'}`}>{tab}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {activeTab === 'manual' ? (
                <ManualControls onMine={handleMine} onMineRemainder={handleMineAll} turnsRemaining={gameState.turnsLeft} disabled={gameState.turnsLeft === 0 || isAutoRunning} currentTileValue={gameState.tiles.get(coordToKey(gameState.currentHex.q, gameState.currentHex.r))?.trueValue || 0} />
              ) : (
                <StrategyBuilder 
                  strategy={strategy} 
                  setStrategy={setStrategy} 
                  activePresetKey={activePresetKey}
                  setActivePresetKey={setActivePresetKey}
                  onRunMission={() => setIsAutoRunning(true)} 
                  onOpenSim={() => setShowSimulator(true)} 
                  onOpenBench={() => setShowBenchmarker(true)}
                  onResetPresets={resetPresets}
                  isAutoRunning={isAutoRunning} 
                  evaluationResults={evaluationResults} 
                />
              )}
            </div>
          </div>
          <button onClick={() => setShowLearning(true)} className="bg-slate-800/20 p-6 rounded-[1.5rem] border border-slate-700/30 hover:border-indigo-400/50 transition-all text-left">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400"><i className="fa-solid fa-rocket text-xl"></i></div>
              <div><h4 className="font-black text-white text-sm uppercase">Mission Briefing</h4><p className="text-[10px] text-slate-500 uppercase font-bold">Exploration Theory</p></div>
            </div>
          </button>
        </div>
      </main>

      {showSummary && <MissionSummary gameState={gameState} onClose={() => setShowSummary(false)} onRestart={resetGame} />}
      {showLearning && <LearningPopup onClose={() => setShowLearning(false)} />}
      {showSimulator && <StrategySimulator strategy={strategy} onClose={() => setShowSimulator(false)} createMap={createMap} decideStep={decideStep} />}
      {showBenchmarker && <StrategyBenchmarker presets={presets} onClose={() => setShowBenchmarker(false)} createMap={createMap} decideStep={decideStep} />}
    </div>
  );
};

export default App;
