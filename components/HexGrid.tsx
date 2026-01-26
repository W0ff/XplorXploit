
import React from 'react';
import { HexCoord, TileData } from '../types';
import { coordToKey, getHexDistance } from '../utils/hexUtils';

interface HexGridProps {
  tiles: Map<string, TileData>;
  currentHex: HexCoord;
  onHexClick?: (coord: HexCoord) => void;
}

const HexGrid: React.FC<HexGridProps> = ({ tiles, currentHex, onHexClick }) => {
  // size = 34 ensures a 9-tile diameter grid fits within a ~550px container height
  const size = 34; 
  const width = size * 2;
  const height = Math.sqrt(3) * size;
  
  const getPixelCoord = (q: number, r: number) => {
    const x = size * (3/2 * q);
    const y = size * (Math.sqrt(3) * (r + q/2));
    return { x, y };
  };

  const getTileValueColor = (val: number) => {
    if (val >= 45) return 'text-sky-300 drop-shadow-[0_0_10px_rgba(125,211,252,0.6)] font-black'; // Rare: Diamond Blue
    if (val === 40) return 'text-amber-400 font-bold'; // Rich: Amber
    if (val === 35) return 'text-orange-500 font-bold'; // High-Tier: Copper
    return 'text-slate-400'; // Standard
  };

  return (
    <div className="relative">
      {Array.from(tiles.values()).map((tile: TileData) => {
        const { x, y } = getPixelCoord(tile.q, tile.r);
        const isPlayerHere = tile.q === currentHex.q && tile.r === currentHex.r;
        const isAdjacent = getHexDistance(currentHex, tile) === 1;
        const canClick = onHexClick && isAdjacent;

        return (
          <div
            key={coordToKey(tile.q, tile.r)}
            onClick={() => canClick && onHexClick(tile)}
            className={`absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2
              ${canClick ? 'cursor-pointer z-30' : 'z-10'}
            `}
            style={{ 
              left: `${x}px`, 
              top: `${y}px`, 
              width: `${width + 0.5}px`, // Bleed to avoid subpixel lines
              height: `${height + 0.5}px` 
            }}
          >
            <div className={`relative w-full h-full group ${isPlayerHere ? 'z-20' : ''}`}>
              {/* Hexagon Surface */}
              <div 
                className={`w-full h-full flex items-center justify-center transition-all duration-500
                  ${tile.revealed 
                    ? 'bg-slate-800 border-2 border-slate-700 shadow-md' 
                    : 'bg-slate-900 border-2 border-slate-800/80 grayscale opacity-60'}
                  ${canClick ? 'hover:scale-110 hover:border-cyan-400 hover:bg-slate-700/40' : ''}
                  ${isPlayerHere ? 'border-cyan-500 bg-slate-800 shadow-[0_0_25px_rgba(6,182,212,0.4)]' : ''}
                `}
                style={{
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                }}
              >
                {/* Resource Value Display */}
                {tile.revealed && (
                  <div className={`flex flex-col items-center select-none transition-all duration-500 
                    ${isPlayerHere 
                      ? 'relative z-10' 
                      : 'relative opacity-90'
                    }
                  `}>
                    <span className={`font-mono leading-none transition-all
                      ${isPlayerHere ? 'text-[9px] text-cyan-200 mt-1.5' : 'text-2xl'}
                      ${!isPlayerHere ? getTileValueColor(tile.trueValue) : ''}
                    `}>
                      {tile.trueValue}
                    </span>
                    
                    {tile.minedCount > 0 && !isPlayerHere && (
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: Math.min(tile.minedCount, 3) }).map((_, i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Obscured Icon for Fog of War Tiles */}
                {!tile.revealed && (
                  <div className="text-slate-800 text-2xl opacity-40 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-satellite-dish"></i>
                  </div>
                )}
              </div>

              {/* Pilot Icon (Visible Ship with Hull Hole) */}
              {isPlayerHere && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none drop-shadow-[0_0_15px_#06b6d4]">
                  {/* Custom Rocket SVG with a hole in the middle (porthole) */}
                  <svg 
                    viewBox="0 0 100 100" 
                    className="w-16 h-16 transition-transform duration-300"
                  >
                    <path 
                      fill="currentColor" 
                      className="text-cyan-500"
                      fillRule="evenodd"
                      d="
                        M 50,5 
                        C 65,25 75,50 75,75 
                        L 85,90 
                        L 70,85 
                        L 30,85 
                        L 15,90 
                        L 25,75 
                        C 25,50 35,25 50,5 
                        Z 
                        M 50,52 m -14,0 a 14,14 0 1,0 28,0 a 14,14 0 1,0 -28,0
                      " 
                      stroke="white" 
                      strokeWidth="3"
                    />
                  </svg>
                  <div className="absolute w-16 h-16 rounded-full border-2 border-cyan-400/20 animate-ping"></div>
                </div>
              )}
              
              {/* Movement indicator */}
              {canClick && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                   <div className="w-12 h-12 rounded-full border-2 border-dashed border-cyan-500/20 animate-spin-slow"></div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HexGrid;
