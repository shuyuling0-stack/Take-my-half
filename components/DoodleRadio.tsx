import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Upload, Radio, ImagePlus, FileText, X, Save, FileUp, Download } from 'lucide-react';
import { MediaData, LyricLine } from '../types';

interface DoodleRadioProps {
  media: MediaData | null;
  onPlayStateChange: (isPlaying: boolean) => void;
  onFileUpload: (files: File[]) => void;
  onLyricsLoaded: (lyrics: LyricLine[]) => void;
  onTimeUpdate: (time: number) => void;
  onTrackFinish?: () => void;
  autoPlay?: boolean;
}

const DoodleRadio: React.FC<DoodleRadioProps> = ({ 
  media, 
  onPlayStateChange, 
  onFileUpload, 
  onLyricsLoaded,
  onTimeUpdate,
  onTrackFinish,
  autoPlay = false
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Lyrics Modal State
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [pastedLyrics, setPastedLyrics] = useState("");

  // Sound Effect Generator using Web Audio API
  const playMechanicalSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const currentTime = ctx.currentTime;

      // 1. Soft Motor Whir
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.type = 'sine'; // Softer sound
      osc.frequency.setValueAtTime(100, currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, currentTime + 0.4);
      
      oscGain.gain.setValueAtTime(0.05, currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.5);

      osc.start(currentTime);
      osc.stop(currentTime + 0.5);

      // 2. Click/Latch sound
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      
      clickOsc.frequency.setValueAtTime(800, currentTime);
      clickGain.gain.setValueAtTime(0, currentTime);
      clickGain.gain.linearRampToValueAtTime(0.1, currentTime + 0.01);
      clickGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
      
      clickOsc.start(currentTime);
      clickOsc.stop(currentTime + 0.1);

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
    // Reset cover when media changes
    setCoverImage(null);
    // Clear lyrics implied by new song? Handled by parent usually, but we reset here visually if needed
    
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

  // Clean up object URL for cover image
  useEffect(() => {
    return () => {
      if (coverImage) {
        URL.revokeObjectURL(coverImage);
      }
    };
  }, [coverImage]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      const p = (currentTime / duration) * 100;
      
      setProgress(p || 0);
      onTimeUpdate(currentTime);
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

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setCoverImage(url);
    }
  };

  // --- Lyrics Parsing Logic ---
  const parseLRC = (lrcString: string): LyricLine[] => {
    const lines = lrcString.split('\n');
    const lyrics: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    lines.forEach(line => {
      const match = line.match(timeRegex);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3], 10);
        // Normalize milliseconds (some lrc use 2 digits, some 3)
        const ms = match[3].length === 3 ? milliseconds : milliseconds * 10;
        const time = minutes * 60 + seconds + ms / 1000;
        const text = line.replace(timeRegex, '').trim();
        if (text) {
          lyrics.push({ time, text });
        }
      } else {
         // Fallback for non-timestamped lines if we wanted, but for sync we skip
         // or could push with previous time.
      }
    });
    return lyrics;
  };

  const handleLyricsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            // Update textarea for editing
            setPastedLyrics(text);
            
            const parsed = parseLRC(text);
            if (parsed.length > 0) {
                onLyricsLoaded(parsed);
                // Don't close modal automatically, let user see the text
                // setShowLyricsModal(false); 
                playMechanicalSound();
            } else {
                alert("Could not parse lyrics. Please use standard .lrc format.");
            }
        };
        reader.readAsText(file);
    }
  };

  const handleSavePastedLyrics = () => {
    const parsed = parseLRC(pastedLyrics);
    if (parsed.length > 0) {
        onLyricsLoaded(parsed);
        setShowLyricsModal(false);
        playMechanicalSound();
        // Keep pastedLyrics in state in case they open modal again to edit
    } else if (pastedLyrics.trim() === "") {
        onLyricsLoaded([]);
        setShowLyricsModal(false);
    } else {
        alert("Could not parse text. Ensure lines start with [mm:ss.xx].");
    }
  };

  const handleDownloadLyrics = () => {
    if (!pastedLyrics.trim()) {
      alert("No lyrics content to download.");
      return;
    }

    const blob = new Blob([pastedLyrics], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Determine filename
    let filename = 'lyrics.lrc';
    if (media && media.name) {
        // Strip existing extension if present
        filename = media.name.replace(/\.[^/.]+$/, "") + ".lrc";
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playMechanicalSound();
  };

  return (
    <div className="relative w-full max-w-lg mx-auto p-2 md:p-6">
      {/* Audio Element */}
      {media?.type === 'audio' && (
        <audio
          ref={audioRef}
          src={media.url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

      {/* Main Radio Body */}
      <div className="relative border border-white/70 rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 bg-white/5 backdrop-blur-[4px] shadow-[0_8px_40px_rgba(0,0,0,0.1)] z-10 transition-all duration-500 hover:shadow-[0_12px_60px_rgba(255,255,255,0.15)] group">
        
        {/* Inner Decorative Bezel/Frame for depth */}
        <div className="absolute inset-2 md:inset-3 border border-white/20 rounded-[2rem] md:rounded-[3rem] pointer-events-none"></div>

        {/* Elegant Strap Handle */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 border-t-[3px] border-white/80 rounded-t-full -z-10 opacity-90"></div>
        
        {/* Antenna - Minimalist Line */}
        <div className="absolute -top-16 right-8 md:right-12 w-[1px] h-24 bg-white/60 transform rotate-[12deg] -z-20 origin-bottom transition-transform duration-700 group-hover:rotate-[5deg]">
             <div className="w-2 h-2 rounded-full bg-white absolute -top-1 -left-[3.5px] shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
        </div>

        {/* Small Feet - Rounded Pegs */}
        <div className="absolute -bottom-3 left-10 md:left-16 w-3 h-3 md:w-4 md:h-4 bg-white/20 backdrop-blur-md rounded-full -z-10 shadow-sm"></div>
        <div className="absolute -bottom-3 right-10 md:right-16 w-3 h-3 md:w-4 md:h-4 bg-white/20 backdrop-blur-md rounded-full -z-10 shadow-sm"></div>

        {/* Screws - Minimalist dots */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 w-1 h-1 bg-white/40 rounded-full"></div>
        <div className="absolute top-4 right-4 md:top-6 md:right-6 w-1 h-1 bg-white/40 rounded-full"></div>
        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 w-1 h-1 bg-white/40 rounded-full"></div>
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-1 h-1 bg-white/40 rounded-full"></div>

        {/* Top Header: Branding & Indicators */}
        <div className="flex justify-between items-center mb-6 md:mb-8 px-2 relative z-20">
           <div className="flex items-center gap-3">
               {/* Decorative lines */}
               <div className="flex flex-col gap-[3px]">
                   <div className="w-6 h-[1px] bg-white/60"></div>
                   <div className="w-4 h-[1px] bg-white/60"></div>
               </div>
               <span className="text-[10px] md:text-xs font-light tracking-[0.3em] text-white/90 font-serif">HAUTE FIDÉLITÉ</span>
           </div>
           
           <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isPlaying ? 'bg-emerald-300 shadow-[0_0_8px_#6ee7b7]' : 'bg-white/30'}`}></div>
               <span className="text-[9px] tracking-[0.2em] text-white/70">EN ONDE</span>
           </div>
        </div>

        {/* Cassette Window - Framed & Elegant - NOW CLICKABLE FOR COVER UPLOAD */}
        <label className="relative block border border-white/50 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-6 md:mb-8 h-32 md:h-40 flex items-center justify-between overflow-hidden bg-black/5 shadow-inner cursor-pointer group/screen transition-all hover:border-white/70">
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleCoverUpload}
          />
          
          {/* Cover Image Layer */}
          {coverImage && (
            <div className="absolute inset-0 z-0">
                <img src={coverImage} alt="Song Cover" className={`w-full h-full object-cover opacity-90 transition-transform duration-[10s] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`} />
                <div className="absolute inset-0 bg-black/20"></div> {/* Dim for text readability */}
            </div>
          )}

          {/* Hover Overlay for Upload Action */}
          <div className={`absolute inset-0 z-20 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${coverImage ? 'opacity-0 group-hover/screen:opacity-100' : 'opacity-0 group-hover/screen:opacity-100'}`}>
                <div className="flex flex-col items-center gap-2 text-white/90">
                    <ImagePlus size={24} strokeWidth={1} />
                    <span className="text-[10px] tracking-[0.2em] font-light uppercase">
                        {coverImage ? 'Changer la pochette' : 'Ajouter une pochette'}
                    </span>
                </div>
          </div>
          
          {/* Glass Reflection Effect (Keep on top) */}
          <div className="absolute -top-10 -right-10 w-20 h-40 bg-white/5 rotate-12 blur-xl pointer-events-none z-30"></div>

          {/* Track Info */}
          <div className="absolute top-3 left-0 w-full flex justify-center z-30 overflow-hidden pointer-events-none">
             <div className="max-w-[85%] whitespace-nowrap overflow-hidden px-4 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
                  <span className="text-[10px] md:text-xs font-light tracking-widest text-white/90 inline-block uppercase drop-shadow-md">
                     {media ? media.name : "Insérer la cassette"}
                  </span>
             </div>
          </div>

          {/* Animation Content (Only show if no cover image) */}
          {!coverImage && (
            <div className="w-full flex items-center justify-center gap-6 md:gap-12 mt-3 relative z-10">
                {media?.type === 'audio' ? (
                    <>
                        {/* Left Reel */}
                        <div 
                            className={`relative w-14 h-14 md:w-20 md:h-20 border border-white/80 rounded-full flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} 
                            style={{ animationDuration: '4s', animationTimingFunction: 'linear' }}
                        >
                            {/* Elegant 3-Spoke Design */}
                            <div className="absolute w-full h-full rounded-full border-[6px] border-white/10"></div>
                            <div className="absolute w-[1px] h-full bg-white/40"></div>
                            <div className="absolute w-[1px] h-full bg-white/40 rotate-60"></div>
                            <div className="absolute w-[1px] h-full bg-white/40 -rotate-60"></div>
                            
                            {/* Tape Pack (White filled circle) */}
                            <div 
                                className="absolute bg-white/20 rounded-full transition-all duration-1000 backdrop-blur-sm"
                                style={{ 
                                    width: `${Math.max(20, (50 - (progress * 0.3)))}%`, 
                                    height: `${Math.max(20, (50 - (progress * 0.3)))}%` 
                                }}
                            ></div>
                            
                            {/* Center Hub */}
                            <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full z-10 shadow-sm"></div>
                        </div>

                        {/* Center Decoration */}
                        <div className="h-full flex flex-col justify-end pb-2 gap-1 opacity-50">
                            <div className="w-8 md:w-12 h-[1px] bg-white/40"></div>
                            <div className="w-8 md:w-12 h-[1px] bg-white/40"></div>
                        </div>

                        {/* Right Reel */}
                        <div 
                            className={`relative w-14 h-14 md:w-20 md:h-20 border border-white/80 rounded-full flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} 
                            style={{ animationDuration: '4s', animationTimingFunction: 'linear' }}
                        >
                            <div className="absolute w-full h-full rounded-full border-[6px] border-white/10"></div>
                            <div className="absolute w-[1px] h-full bg-white/40"></div>
                            <div className="absolute w-[1px] h-full bg-white/40 rotate-60"></div>
                            <div className="absolute w-[1px] h-full bg-white/40 -rotate-60"></div>

                            <div 
                                className="absolute bg-white/20 rounded-full transition-all duration-1000 backdrop-blur-sm"
                                style={{ 
                                    width: `${Math.max(20, (20 + (progress * 0.3)))}%`, 
                                    height: `${Math.max(20, (20 + (progress * 0.3)))}%` 
                                }}
                            ></div>

                            <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full z-10 shadow-sm"></div>
                        </div>
                    </>
                ) : (
                    <div className="text-white/30 flex flex-col items-center gap-2">
                        <Radio size={28} className="md:w-[36px] md:h-[36px]" strokeWidth={0.7} />
                        <span className="text-[8px] tracking-[0.3em] font-light">ABSENT</span>
                    </div>
                )}
            </div>
          )}
        </label>

        {/* Progress Bar - Minimalist Line */}
        <div className="w-full h-[1px] bg-white/20 mb-6 md:mb-10 relative group cursor-pointer">
             <div className="absolute -top-3 -bottom-3 w-full z-10"></div>
             <div 
               className="h-full bg-white/90 relative transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
               style={{ width: `${progress}%` }}
             >
                {/* Diamond Scrubber */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rotate-45 shadow-md scale-0 group-hover:scale-100 transition-transform duration-200"></div>
             </div>
        </div>

        {/* Control Panel */}
        <div className="flex items-center justify-between px-2 md:px-6">
            
            {/* Left Speaker Grille (Lines) */}
            <div className="flex flex-col gap-[6px] w-8 md:w-12 opacity-70">
                {[...Array(5)].map((_, i) => (
                    <div key={`l-${i}`} className="w-full h-[1.5px] bg-white/60 rounded-full shadow-sm"></div>
                ))}
            </div>

            {/* Main Buttons */}
            <div className="flex items-center gap-6 md:gap-10">
                
                {/* Lyrics Button (Opens Modal) */}
                <button 
                    onClick={() => setShowLyricsModal(true)}
                    className="w-8 h-8 md:w-10 md:h-10 border border-white/40 rounded-full flex items-center justify-center transition-all hover:bg-white/10 hover:text-white hover:border-white/80 duration-300 group"
                    title="Lyrics Settings"
                >
                    <FileText size={14} className="md:w-[16px] md:h-[16px]" strokeWidth={1.2} />
                </button>

                <button 
                    onClick={togglePlay}
                    disabled={media?.type !== 'audio' || isStarting}
                    className={`w-16 h-16 md:w-24 md:h-24 border border-white/80 rounded-full flex items-center justify-center transition-all hover:bg-white hover:text-slate-900 hover:scale-105 active:scale-95 duration-300 shadow-lg ${media?.type !== 'audio' ? 'opacity-40 cursor-not-allowed' : ''} ${isStarting ? 'scale-95 opacity-80' : ''}`}
                >
                    {isStarting ? (
                        <div className="w-5 h-5 border-t border-current rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                        <Pause size={28} className="md:w-[32px] md:h-[32px]" strokeWidth={0.8} />
                    ) : (
                        <Play size={28} className="md:w-[32px] md:h-[32px] ml-1" strokeWidth={0.8} />
                    )}
                </button>
                
                {/* Upload Media */}
                 <label className="cursor-pointer flex flex-col items-center group" title="Upload Music">
                    <input type="file" className="hidden" accept="audio/*,video/*" multiple onChange={handleFileChange} />
                    <div className={`w-8 h-8 md:w-10 md:h-10 border border-white/40 rounded-full flex items-center justify-center transition-all hover:bg-white/10 hover:text-white hover:border-white/80 duration-300 ${!media ? 'animate-pulse' : ''}`}>
                        <Upload size={14} className="md:w-[16px] md:h-[16px]" strokeWidth={1.2} />
                    </div>
                </label>
            </div>

            {/* Right Speaker Grille (Lines) */}
            <div className="flex flex-col gap-[6px] w-8 md:w-12 opacity-70">
                {[...Array(5)].map((_, i) => (
                    <div key={`r-${i}`} className="w-full h-[1.5px] bg-white/60 rounded-full shadow-sm"></div>
                ))}
            </div>
        </div>
      </div>

      {/* Lyrics Modal (Portal to body to escape 3D transform) */}
      {showLyricsModal && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-zinc-900/90 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl relative">
                <button 
                    onClick={() => setShowLyricsModal(false)}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
                
                <h3 className="text-xl text-white font-light mb-4 tracking-wider flex items-center gap-2" style={{ fontFamily: "'Londrina Sketch', cursive" }}>
                    <FileText size={24} />
                    Paroles / Lyrics
                </h3>
                
                <textarea
                    value={pastedLyrics}
                    onChange={(e) => setPastedLyrics(e.target.value)}
                    placeholder="[00:12.00] Paste your LRC text here..."
                    className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-white/90 font-mono text-xs md:text-sm resize-none focus:outline-none focus:border-white/30 mb-6 placeholder:text-white/20 shadow-inner"
                    spellCheck={false}
                />
                
                <div className="flex gap-3">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white/80 hover:text-white text-sm font-light">
                        <input type="file" className="hidden" accept=".lrc,.txt" onChange={handleLyricsUpload} />
                        <FileUp size={16} />
                        Import
                    </label>

                    <button 
                        onClick={handleDownloadLyrics}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white/80 hover:text-white text-sm font-light"
                        title="Download as .lrc"
                    >
                        <Download size={16} />
                        Download
                    </button>
                    
                    <button 
                        onClick={handleSavePastedLyrics}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-all font-medium text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    >
                        <Save size={16} />
                        Apply
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default DoodleRadio;