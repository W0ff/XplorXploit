import React from 'react';

interface StrategyWalkthroughProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

const StrategyWalkthrough: React.FC<StrategyWalkthroughProps> = ({ step, onNext, onSkip }) => {
  const steps = [
    {
      title: "Strategy Presets",
      desc: "These presets define the 'personality' of your autopilot. You can select different baselines like 'Recon' or 'Jackpot Hunter', or reset them if you make changes.",
      positionClass: "top-0",
      icon: "fa-robot"
    },
    {
      title: "Custom Logic Builder",
      desc: "Build your own strategy from scratch! Add rules using 'IF' conditions and 'DO' actions to create complex behaviors for the mining ship.",
      positionClass: "top-1/3",
      icon: "fa-screwdriver-wrench"
    },
    {
      title: "Execute 100X",
      desc: "Once you've validated your strategy with a single mission, use this to simulate 100 games instantly. It's the best way to test reliability.",
      positionClass: "bottom-20",
      icon: "fa-infinity"
    },
    {
      title: "Compare Strategies",
      desc: "The ultimate test. Run a massive benchmark comparing ALL your presets against each other to see which logic reigns supreme.",
      positionClass: "bottom-0",
      icon: "fa-layer-group"
    }
  ];

  const current = steps[step - 1] || steps[0];

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto flex flex-col rounded-2xl overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm transition-opacity duration-500"></div>

      {/* Content Container */}
      <div className={`absolute w-full px-4 transition-all duration-500 ease-in-out ${current.positionClass}`}>
         <div className="bg-slate-900 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] rounded-2xl p-5 animate-in slide-in-from-bottom-2 fade-in duration-300 relative z-50">
            <div className="flex items-start gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-500/20">
                <i className={`fa-solid ${current.icon} text-lg`}></i>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-black uppercase tracking-wide text-sm leading-tight mt-1">{current.title}</h3>
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700'}`}></div>
                  ))}
                </div>
              </div>
            </div>
            
            <p className="text-slate-400 text-xs leading-relaxed mb-5 font-medium">
              {current.desc}
            </p>

            <div className="flex gap-3">
               <button onClick={onSkip} className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                 Skip Tour
               </button>
               <button onClick={onNext} className="flex-[2] py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
                 {step === 4 ? "Get Started" : "Next"}
               </button>
            </div>
            
            {/* Visual Arrow/Pointer (Decorative) */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-l border-t border-cyan-500/30 transform rotate-45 
              ${current.positionClass.includes('bottom') ? 'top-full -mt-2 border-l-0 border-t-0 border-r border-b' : '-top-2'}
            `}></div>
         </div>
      </div>
    </div>
  );
};

export default StrategyWalkthrough;