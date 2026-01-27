import React from 'react';

interface ManualControlsProps {
  onMine: () => void;
  onMineRemainder: () => void;
  disabled: boolean;
  currentTileValue: number;
  turnsRemaining: number;
}

const ManualControls: React.FC<ManualControlsProps> = ({ 
  onMine, 
  onMineRemainder, 
  disabled, 
  currentTileValue,
  turnsRemaining
}) => {
  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="space-y-3">
        <h3 className="text-slate-300 text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <i className="fa-solid fa-compass text-cyan-500"></i> Local Sector Analysis
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          The current tile is emitting <span className="text-white font-bold">{currentTileValue} units</span> of ore signature. Extraction will yield immediate results.
        </p>
      </div>

      <div className="flex-1 flex flex-row justify-center items-center gap-4">
        {/* Main Extract Button */}
        <div className="relative group">
          {!disabled && (
            <>
              <div className="absolute -inset-6 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-all animate-pulse"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            </>
          )}
          
          <button
            onClick={onMine}
            disabled={disabled}
            className={`relative w-40 h-40 rounded-full border-4 border-slate-700 flex flex-col items-center justify-center transition-all active:scale-90
              ${disabled 
                ? 'opacity-30 cursor-not-allowed bg-slate-800 border-slate-900 grayscale' 
                : 'bg-gradient-to-br from-slate-800 to-slate-950 hover:border-cyan-400 shadow-2xl overflow-hidden'
              }
            `}
          >
            <i className={`fa-solid fa-pickaxe text-3xl mb-2 ${disabled ? 'text-slate-600' : 'text-cyan-400 group-hover:animate-bounce'}`}></i>
            <span className={`font-black text-xl tracking-tighter ${disabled ? 'text-slate-600' : 'text-white'}`}>EXTRACT</span>
            <div className={`mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${disabled ? 'bg-slate-700 text-slate-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
              Yield: +{currentTileValue}
            </div>
          </button>
        </div>

        {/* Extract Remainder Button */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onMineRemainder}
            disabled={disabled || turnsRemaining <= 0}
            className={`w-24 h-24 rounded-full border-2 border-slate-700 flex flex-col items-center justify-center transition-all active:scale-90 group
              ${disabled || turnsRemaining <= 0
                ? 'opacity-30 cursor-not-allowed bg-slate-800 border-slate-900' 
                : 'bg-slate-900 hover:border-indigo-400 hover:bg-slate-800 shadow-xl'
              }
            `}
          >
            <i className={`fa-solid fa-angles-right text-lg mb-1 ${disabled ? 'text-slate-600' : 'text-indigo-400 group-hover:translate-x-1 transition-transform'}`}></i>
            <span className={`text-[10px] font-black text-center leading-tight tracking-tight uppercase px-2 ${disabled ? 'text-slate-600' : 'text-slate-300'}`}>
              Extract<br/>Remainder
            </span>
            <div className={`mt-1 text-[9px] font-bold ${disabled ? 'text-slate-700' : 'text-slate-500'}`}>
              x{turnsRemaining}
            </div>
          </button>
          <div className="text-[8px] text-center font-black text-slate-600 uppercase tracking-widest">Efficiency</div>
        </div>
      </div>

      <div className="bg-slate-800/60 p-5 rounded-[1.5rem] border border-slate-700/50 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 p-2 opacity-5 scale-150">
          <i className="fa-solid fa-battery-half text-6xl"></i>
        </div>
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-400">
            <i className="fa-solid fa-bolt"></i>
          </div>
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Mission Logistics</h4>
        </div>
        <p className="text-xs text-slate-400 leading-normal relative z-10">
          Every <span className="text-indigo-400 font-bold">MOVE</span> or <span className="text-cyan-400 font-bold">MINE</span> consumes exactly 1 unit of life support (Turn). <span className="text-white font-bold">EXTRACT REMAINDER</span> dumps all remaining energy into the current tile.
        </p>
      </div>
    </div>
  );
};

export default ManualControls;