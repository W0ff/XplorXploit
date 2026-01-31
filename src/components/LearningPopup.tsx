import React from 'react';

interface LearningPopupProps {
  onClose: () => void;
}

const LearningPopup: React.FC<LearningPopupProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
        <div className="relative h-32 md:h-48 bg-cyan-900/30 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-cyan-500 rounded-full flex items-center justify-center text-white text-3xl md:text-4xl shadow-[0_0_30px_rgba(6,182,212,0.5)] mb-3 md:mb-4">
              <i className="fa-solid fa-rocket"></i>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">Prepare for Launch</h2>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <h3 className="text-lg md:text-xl font-bold text-cyan-400">Exploration vs. Exploitation</h3>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              This game is a visual model of the <span className="text-white font-bold italic">Multi-Armed Bandit</span> problem. In Reinforcement Learning, agents must decide:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 md:p-5 rounded-2xl border-l-4 border-cyan-500">
                <h4 className="font-bold text-cyan-400 uppercase text-xs mb-2 tracking-widest">XPLORE (Move)</h4>
                <p className="text-xs md:text-sm text-slate-400 leading-tight">Searching for new information. You move to find tiles with higher values, but you don't earn any points while moving.</p>
              </div>
              <div className="bg-slate-800/50 p-4 md:p-5 rounded-2xl border-l-4 border-amber-500">
                <h4 className="font-bold text-amber-400 uppercase text-xs mb-2 tracking-widest">XPLOIT (Mine)</h4>
                <p className="text-xs md:text-sm text-slate-400 leading-tight">Using the best information you already have. You stay put and earn points, but you might be missing out on a jackpot nearby.</p>
              </div>
            </div>

            <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 italic">
              <p className="text-xs md:text-sm text-slate-300 text-center">
                "Exploring helps you find better rewards, but Exploiting is what actually earns you points. Balancing the two is the key to a successful strategy."
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-black py-4 md:py-5 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20 text-xs md:text-base"
          >
            Initialize Strategy Protocols
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningPopup;