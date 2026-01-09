import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Upload, Music, Disc, Radio } from 'lucide-react';
import { MediaData } from '../types';

interface DoodleRadioProps {
  media: MediaData | null;
  onPlayStateChange: (isPlaying: boolean) => void;
  onFileUpload: (files: File[]) => void;
  onTrackFinish?: () => void;
  autoPlay?: boolean;
}

const DoodleRadio: React.FC<DoodleRadioProps> = ({ 
  media, 
  onPlayStateChange, 
  onFileUpload, 
  onTrackFinish,
  autoPlay = false
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sound Effect Generator using Web Audio API
  const playMechanicalSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const currentTime = ctx.currentTime;

      // 1. Motor/Mechanism Whir (Oscillator)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50, currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, currentTime + 0.3);
      
      oscGain.gain.setValueAtTime(0.05, currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.4);

      osc.start(currentTime);
      osc.stop(currentTime + 0.4);

      // 2. Static/Friction Burst (White Noise)
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.value = 800;

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseGain.gain.setValueAtTime(0.08, currentTime);
      noiseGain.gain.linearRampToValueAtTime(0, currentTime + 0.3);

      noise.start(currentTime);

    } catch (e) {
      console.warn("Audio Context failed:", e);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !media || media.type !== 'audio') return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange(false);
    } else {
      if (isStarting) return;
      
      setIsStarting(true);
      playMechanicalSound();

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              onPlayStateChange(true);
            })
            .catch((err) => {
              console.warn("Playback failed:", err);
            })
            .finally(() => {
               setIsStarting(false);
            });
        } else {
            setIsStarting(false);
        }
      }, 500);
    }
  };

  useEffect(() => {
    setProgress(0);
    if (media && media.type === 'audio' && autoPlay) {
      const timeoutId = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              onPlayStateChange(true);
            })
            .catch((err) => {
              console.warn("Auto-play blocked or failed:", err);
              setIsPlaying(false);
              onPlayStateChange(false);
            });
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    } else {
      setIsPlaying(false);
      onPlayStateChange(false);
    }
  }, [media]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onPlayStateChange(false);
    setProgress(0);
    if (onTrackFinish) {
        onTrackFinish();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).slice(0, 5);
      onFileUpload(files);
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto p-0 md:p-4">
      {/* Audio Element */}
      {media?.type === 'audio' && (
        <audio
          ref={audioRef}
          src={media.url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

      {/* Radio Body */}
      <div className="relative border border-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 bg-white/5 backdrop-blur-[2px] shadow-[0_0_40px_rgba(255,255,255,0.05)] z-10 transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,255,255,0.1)]">
        
        {/* Feet */}
        <div className="absolute -bottom-2 left-8 md:left-12 w-6 md:w-8 h-2 border border-t-0 border-white rounded-b-md -z-10 bg-transparent"></div>
        <div className="absolute -bottom-2 right-8 md:right-12 w-6 md:w-8 h-2 border border-t-0 border-white rounded-b-md -z-10 bg-transparent"></div>

        {/* Handle */}
        <div className="absolute -top-6 md:-top-10 left-1/2 -translate-x-1/2 w-32 md:w-40 h-6 md:h-10 border border-white border-b-0 rounded-t-xl -z-10">
             <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-2">
                 <div className="w-0.5 h-0.5 bg-white rounded-full opacity-50"></div>
                 <div className="w-0.5 h-0.5 bg-white rounded-full opacity-50"></div>
                 <div className="w-0.5 h-0.5 bg-white rounded-full opacity-50"></div>
             </div>
        </div>
        
        {/* Antenna - Compact mobile sizing */}
        <div className="absolute -top-8 md:-top-28 right-4 md:right-6 w-px h-8 md:h-28 bg-white/80 transform rotate-[8deg] -z-20 origin-bottom">
             <div className="w-1.5 h-1.5 rounded-full border border-white bg-black absolute -top-1 -left-[2.5px]"></div>
        </div>

        {/* Screws */}
        <div className="absolute top-3 left-3 md:top-4 md:left-4 text-white/40 text-[8px]">+</div>
        <div className="absolute top-3 right-3 md:top-4 md:right-4 text-white/40 text-[8px]">+</div>
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 text-white/40 text-[8px]">+</div>
        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 text-white/40 text-[8px]">+</div>

        {/* Top Indicators */}
        <div className="flex justify-between items-end mb-4 md:mb-8 px-1">
           <div className="flex items-center space-x-3">
               <div className="flex flex-col space-y-1">
                   <div className="w-8 h-px bg-white/30"></div>
                   <div className="w-5 h-px bg-white/30"></div>
               </div>
               <span className="text-[10px] font-light tracking-[0.3em] text-white">HI-FI AUDIO</span>
           </div>
           <div className="flex items-center space-x-2">
               <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-white shadow-[0_0_8px_white]' : 'border border-white/50 bg-transparent'}`}></div>
               <span className="text-[9px] tracking-[0.2em] text-white/70">ON AIR</span>
           </div>
        </div>

        {/* Tape Cassette Window */}
        <div className="border border-white/80 rounded-lg p-3 md:p-6 mb-5 md:mb-8 h-28 md:h-36 relative flex items-center justify-between overflow-hidden bg-white/[0.02]">
          
          {/* Track Info */}
          <div className="absolute top-3 left-0 w-full flex justify-center z-10 overflow-hidden">
             <div className="max-w-[80%] whitespace-nowrap overflow-hidden">
                  <span className="text-xs font-light tracking-widest text-white inline-block">
                     {media ? media.name : "NO CASSETTE LOADED"}
                  </span>
             </div>
          </div>

          {/* Animation Content */}
          <div className="w-full flex items-center justify-center gap-4 md:gap-8 mt-2 md:mt-4">
             {media?.type === 'audio' ? (
                <>
                    {/* Left Reel */}
                    <div 
                        className={`relative w-12 h-12 md:w-16 md:h-16 border border-white rounded-full flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} 
                        style={{ animationDuration: '3s', animationTimingFunction: 'linear' }}
                    >
                        {/* Spoke Design */}
                        <div className="absolute w-full h-px bg-white/20"></div>
                        <div className="absolute h-full w-px bg-white/20"></div>
                        <div className="absolute w-full h-px bg-white/20 rotate-45"></div>
                        <div className="absolute h-full w-px bg-white/20 rotate-45"></div>
                        
                        {/* Tape Pack Size (Shrinks as plays) */}
                        <div 
                            className="absolute bg-white/10 rounded-full transition-all duration-1000"
                            style={{ 
                                width: `${Math.max(16, (40 - (progress * 0.24)))}px`, // responsive math roughly
                                height: `${Math.max(16, (40 - (progress * 0.24)))}px` 
                            }}
                        ></div>
                        
                        {/* Hub */}
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full z-10"></div>
                    </div>

                    {/* Center Visualizer */}
                    <div className="h-8 md:h-10 flex items-center justify-center space-x-[2px] md:space-x-[3px]">
                         {[...Array(12)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-px bg-white"
                                style={{
                                    height: isPlaying ? '100%' : '10%',
                                    minHeight: '4px',
                                    animation: isPlaying ? `bounce ${0.8 + Math.random() * 0.4}s infinite alternate ease-in-out` : 'none',
                                    animationDelay: `${i * 0.05}s`,
                                    opacity: 0.9
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* Right Reel */}
                    <div 
                        className={`relative w-12 h-12 md:w-16 md:h-16 border border-white rounded-full flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} 
                        style={{ animationDuration: '3s', animationTimingFunction: 'linear' }}
                    >
                        {/* Spoke Design */}
                        <div className="absolute w-full h-px bg-white/20"></div>
                        <div className="absolute h-full w-px bg-white/20"></div>
                        <div className="absolute w-full h-px bg-white/20 rotate-45"></div>
                        <div className="absolute h-full w-px bg-white/20 rotate-45"></div>

                        {/* Tape Pack Size (Grows as plays) */}
                        <div 
                            className="absolute bg-white/10 rounded-full transition-all duration-1000"
                            style={{ 
                                width: `${Math.max(16, (16 + (progress * 0.24)))}px`, 
                                height: `${Math.max(16, (16 + (progress * 0.24)))}px` 
                            }}
                        ></div>

                        {/* Hub */}
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full z-10"></div>
                    </div>
                </>
             ) : (
                <div className="text-white/30 flex flex-col items-center">
                    <Radio size={24} className="md:w-[32px] md:h-[32px]" strokeWidth={0.5} stroke="currentColor" />
                    <span className="text-[9px] tracking-[0.3em] mt-2">INSERT TAPE</span>
                </div>
             )}
          </div>
          
          {/* Tape Connector Line (Bottom) */}
          {media?.type === 'audio' && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-32 md:w-48 h-8 md:h-12 border-b border-white/10 -z-0 rounded-[50%]"></div>
          )}
        </div>

        {/* Progress */}
        <div className="w-full h-px bg-white/10 mb-5 md:mb-8 relative group cursor-pointer">
             <div className="absolute -top-2 -bottom-2 w-full z-10"></div>
             <div 
               className="h-full bg-white relative transition-all duration-300"
               style={{ width: `${progress}%` }}
             >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rotate-45 shadow-[0_0_8px_white] scale-0 group-hover:scale-100 transition-transform duration-200"></div>
             </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-2 md:px-4">
            <div className="grid grid-cols-4 gap-[2px] w-8 md:w-12 opacity-50">
                {[...Array(16)].map((_, i) => (
                    <div key={`s1-${i}`} className="w-[1.5px] h-[1.5px] bg-white rounded-full"></div>
                ))}
            </div>

            <div className="flex items-center gap-4 md:gap-8">
                <label className="cursor-pointer flex flex-col items-center group">
                    <input type="file" className="hidden" accept="audio/*,video/*" multiple onChange={handleFileChange} />
                    <div className={`w-8 h-8 md:w-10 md:h-10 border border-white rounded-full flex items-center justify-center transition-all hover:bg-white hover:text-black hover:scale-110 duration-300 ${!media ? 'animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}`}>
                        <Upload size={12} className="md:w-[14px] md:h-[14px]" strokeWidth={1} />
                    </div>
                </label>

                <button 
                    onClick={togglePlay}
                    disabled={media?.type !== 'audio' || isStarting}
                    className={`w-16 h-16 md:w-20 md:h-20 border border-white rounded-full flex items-center justify-center transition-all hover:bg-white hover:text-black hover:scale-105 active:scale-95 duration-300 ${media?.type !== 'audio' ? 'opacity-30 cursor-not-allowed' : ''} ${isStarting ? 'scale-95 opacity-80' : ''}`}
                >
                    {isStarting ? (
                        <div className="w-4 h-4 border-t border-black rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                        <Pause size={24} className="md:w-[28px] md:h-[28px]" strokeWidth={0.75} />
                    ) : (
                        <Play size={24} className="md:w-[28px] md:h-[28px] ml-1" strokeWidth={0.75} />
                    )}
                </button>
                
                <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center opacity-0 pointer-events-none"></div>
            </div>

            <div className="grid grid-cols-4 gap-[2px] w-8 md:w-12 opacity-50">
                {[...Array(16)].map((_, i) => (
                    <div key={`s2-${i}`} className="w-[1.5px] h-[1.5px] bg-white rounded-full"></div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default DoodleRadio;