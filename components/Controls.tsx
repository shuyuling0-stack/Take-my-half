import React from 'react';
import { Season } from '../types';
import { Image, CloudRain, Snowflake, Flower2, Leaf, Minimize2, Maximize2 } from 'lucide-react';

interface ControlsProps {
  currentSeason: Season;
  setSeason: (s: Season) => void;
  onBgUpload: (file: File) => void;
  isPlayerHidden: boolean;
  onToggleVisibility: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  currentSeason, 
  setSeason, 
  onBgUpload,
  isPlayerHidden,
  onToggleVisibility
}) => {
  
  const seasonConfig = [
    { type: Season.Spring, icon: Flower2 },
    { type: Season.Summer, icon: CloudRain },
    { type: Season.Autumn, icon: Leaf },
    { type: Season.Winter, icon: Snowflake },
  ];

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] w-auto max-w-[90%] pointer-events-auto">
      {/* Unified Dock Container */}
      <div className="flex items-center p-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-transform hover:scale-105 duration-300">
        
        {/* Season Switcher Group */}
        <div className="flex space-x-1 md:space-x-2 px-2">
            {seasonConfig.map((s) => (
                <button
                    key={s.type}
                    onClick={() => setSeason(s.type)}
                    className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 group ${
                        currentSeason === s.type 
                        ? 'bg-white text-slate-900 shadow-md transform scale-110' 
                        : 'text-white hover:bg-white/20'
                    }`}
                    title={s.type}
                >
                    <s.icon size={16} strokeWidth={currentSeason === s.type ? 2 : 1.5} className="md:w-5 md:h-5" />
                    {currentSeason === s.type && (
                        <span className="absolute -bottom-1 w-1 h-1 bg-slate-900 rounded-full"></span>
                    )}
                </button>
            ))}
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-white/20 mx-2 md:mx-4"></div>

        {/* Actions Group */}
        <div className="flex items-center gap-1 md:gap-2 px-2">
            {/* Background Upload */}
            <label className="cursor-pointer group relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-white/20 transition-all text-white" title="Change Background">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && onBgUpload(e.target.files[0])}
                />
                <Image size={16} strokeWidth={1.5} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
            </label>

            {/* Collapse/Expand Toggle */}
            <button 
                onClick={onToggleVisibility}
                className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-white/20 transition-all text-white group"
                title={isPlayerHidden ? "Show Player" : "Hide Player"}
            >
                {isPlayerHidden ? (
                    <Maximize2 size={16} strokeWidth={1.5} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                ) : (
                    <Minimize2 size={16} strokeWidth={1.5} className="md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                )}
            </button>
        </div>

      </div>
    </div>
  );
};

export default Controls;