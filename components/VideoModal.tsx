import React, { useState } from 'react';
import { X, Moon, Sun, Film } from 'lucide-react';

interface VideoModalProps {
  url: string;
  onClose: () => void;
  onEnded?: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ url, onClose, onEnded }) => {
  // State for "Cinema Mode" (Lights Off)
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  return (
    <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-700 ease-in-out ${
            isCinemaMode ? 'bg-black/90 backdrop-blur-2xl' : 'bg-white/30 backdrop-blur-md'
        }`}
    >
      {/* Ambient Glow Background - Subtle pulsing color behind the video */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[50vh] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-[100px] opacity-20 animate-pulse pointer-events-none transition-opacity duration-1000 ${
            isCinemaMode ? 'opacity-30' : 'opacity-20'
        }`}
      ></div>

      <div className="relative w-full max-w-5xl p-4 flex flex-col items-center animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
        
        {/* Floating Control Bar */}
        <div className="flex items-center gap-3 mb-6 bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-lg z-20 transition-transform hover:scale-105">
            <div className="flex items-center gap-2 mr-2">
                <Film size={14} className="text-white/70" />
                <span className="text-[10px] tracking-[0.2em] text-white/80 uppercase font-medium">
                    {isCinemaMode ? 'Mode Cinéma' : 'Mode Lumière'}
                </span>
            </div>
            
            <div className="w-[1px] h-4 bg-white/20"></div>

            {/* Toggle Cinema Mode */}
            <button 
                onClick={() => setIsCinemaMode(!isCinemaMode)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white/90 transition-colors"
                title={isCinemaMode ? "Lights On" : "Lights Off"}
            >
                {isCinemaMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Close Button */}
            <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-all hover:rotate-90"
                title="Close"
            >
                <X size={18} />
            </button>
        </div>

        {/* Main Video Container */}
        <div className="relative group w-full">
            
            {/* Outer Frame with dynamic styling based on mode */}
            <div className={`relative p-2 md:p-3 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-700 border shadow-2xl ${
                isCinemaMode 
                ? 'bg-zinc-900/80 border-white/10 shadow-black/50' 
                : 'bg-white/40 border-white/60 shadow-xl shadow-indigo-500/10'
            }`}>
                
                {/* Inner Bezel */}
                <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-black relative">
                    <video 
                        src={url} 
                        controls 
                        autoPlay 
                        onEnded={onEnded}
                        className="w-full h-auto max-h-[70vh] block shadow-inner"
                        style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>

            {/* Reflection Effect (Pseudo-reflection) */}
            <div 
                className={`absolute -bottom-6 left-4 right-4 h-12 rounded-[50%] blur-xl transition-all duration-700 pointer-events-none -z-10 ${
                    isCinemaMode ? 'bg-white/5' : 'bg-black/20'
                }`}
            ></div>
        </div>

      </div>
    </div>
  );
};

export default VideoModal;