import React, { useEffect, useRef, useMemo, useState } from 'react';
import { LyricLine } from '../types';

interface LyricsOverlayProps {
  lyrics: LyricLine[];
  currentTime: number;
  isVisible: boolean;
}

const LyricsOverlay: React.FC<LyricsOverlayProps> = ({ lyrics, currentTime, isVisible }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [translateY, setTranslateY] = useState(0);

  // Find the current active line index
  const activeIndex = useMemo(() => {
    if (!lyrics.length) return -1;
    // Find the last line whose time is less than or equal to current time
    const index = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return line.time <= currentTime && (!nextLine || nextLine.time > currentTime);
    });
    return index === -1 ? 0 : index;
  }, [lyrics, currentTime]);

  // Silky Smooth Scrolling Logic
  useEffect(() => {
    if (isVisible && lineRefs.current[activeIndex] && containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const activeLineElement = lineRefs.current[activeIndex];
        
        if (activeLineElement) {
            const lineTop = activeLineElement.offsetTop;
            const lineHeight = activeLineElement.clientHeight;
            
            // Calculate offset to center the line
            // Target = (Half Container) - (Line Position + Half Line Height)
            const targetOffset = (containerHeight / 2) - (lineTop + lineHeight / 2);
            setTranslateY(targetOffset);
        }
    }
  }, [activeIndex, isVisible, lyrics]); // Recalculate when active index changes

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
      {/* Enhanced Gradient masks */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/10 to-transparent z-20 pointer-events-none mix-blend-overlay"></div>
      
      {lyrics.length > 0 ? (
        <div 
            ref={containerRef}
            className="w-full max-w-3xl h-[70vh] overflow-hidden flex flex-col items-center relative mask-image-gradient"
            style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
            }}
        >
          {/* Moving Track */}
          <div 
            className="absolute w-full flex flex-col items-center gap-8 transition-transform duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform"
            style={{ transform: `translateY(${translateY}px)` }}
          >
            {lyrics.map((line, index) => {
              const isActive = index === activeIndex;
              // Calculate distance from active line for depth effect
              const distance = Math.abs(index - activeIndex);
              
              // Dynamic Style Calculation based on distance
              let scale = 1;
              let opacity = 1;
              let blur = 0;
              let fontWeight = '300';

              if (isActive) {
                  scale = 1.15;
                  opacity = 1;
                  blur = 0;
                  fontWeight = '400';
              } else if (distance === 1) {
                  scale = 0.95;
                  opacity = 0.6;
                  blur = 1;
              } else if (distance === 2) {
                  scale = 0.9;
                  opacity = 0.3;
                  blur = 3;
              } else {
                  scale = 0.85;
                  opacity = 0.1;
                  blur = 5;
              }

              return (
                <div
                  key={index}
                  ref={(el) => { lineRefs.current[index] = el }}
                  className="text-center px-4 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] max-w-[90%]"
                  style={{
                      transform: `scale(${scale})`,
                      opacity: opacity,
                      filter: `blur(${blur}px)`,
                  }}
                >
                  <p 
                      className="text-2xl md:text-4xl tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] text-white"
                      style={{ 
                          fontFamily: "'Patrick Hand', cursive",
                          fontWeight: isActive ? 'bold' : 'normal',
                          // Ensure text rendering is optimized for animation
                          textRendering: 'optimizeLegibility',
                      }}
                  >
                    {line.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-white/40 text-xl font-light tracking-widest animate-pulse flex flex-col items-center gap-2">
            <span>Waiting for lyrics...</span>
            <span className="text-xs opacity-50">Upload .lrc or paste in settings</span>
        </div>
      )}
    </div>
  );
};

export default LyricsOverlay;