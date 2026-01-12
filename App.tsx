import React, { useState, useEffect } from 'react';
import { Season, MediaData, LyricLine } from './types';
import SeasonalCanvas from './components/SeasonalCanvas';
import DoodleRadio from './components/DoodleRadio';
import VideoModal from './components/VideoModal';
import Controls from './components/Controls';
import LyricsOverlay from './components/LyricsOverlay';

const App: React.FC = () => {
  const [season, setSeason] = useState<Season>(Season.Spring);
  
  // Playlist State
  const [playlist, setPlaylist] = useState<MediaData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  
  // Audio State for Lyrics Sync
  const [currentTime, setCurrentTime] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [bgImage, setBgImage] = useState<string>('');
  
  // Visibility State for Immersive Mode
  const [isPlayerHidden, setIsPlayerHidden] = useState(false);
  
  const currentMedia = playlist[currentIndex] || null;
  
  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      playlist.forEach(m => URL.revokeObjectURL(m.url));
      if (bgImage) URL.revokeObjectURL(bgImage);
    };
  }, [playlist, bgImage]);

  // Handle uploading multiple files (Max 5)
  const handleFileUpload = (files: File[]) => {
    const newMediaItems: MediaData[] = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'audio',
      name: file.name
    }));

    setPlaylist(newMediaItems);
    setCurrentIndex(0);
    setAutoPlayNext(false); 
    setLyrics([]); // Reset lyrics for new song
    // If uploading, ensure player is visible
    setIsPlayerHidden(false);
  };

  const handleBgUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setBgImage(url);
  };

  const handleTrackFinish = () => {
    if (currentIndex < playlist.length - 1) {
        // Go to next track
        setCurrentIndex(prev => prev + 1);
        setAutoPlayNext(true); 
        setLyrics([]); // Reset lyrics
    } else {
        // End of playlist
        setIsPlaying(false);
        setAutoPlayNext(false);
    }
  };

  const getGradient = (s: Season) => {
    switch (s) {
      case Season.Spring: return 'linear-gradient(to top, #9796f0 0%, #fbc7d4 100%)'; 
      case Season.Summer: return 'linear-gradient(to top, #2193b0 0%, #6dd5ed 100%)'; 
      case Season.Autumn: return 'linear-gradient(to top, #5d4037 0%, #FBE8C5 100%)'; 
      case Season.Winter: return 'linear-gradient(to top, #2c3e50 0%, #bdc3c7 100%)'; 
      default: return '#333';
    }
  };

  const displayMedia = currentMedia ? {
      ...currentMedia,
      name: playlist.length > 1 
        ? `[${currentIndex + 1}/${playlist.length}] ${currentMedia.name}`
        : currentMedia.name
  } : null;

  return (
    <div 
        className={`relative w-full h-[100dvh] overflow-hidden flex flex-col ${season === Season.Autumn ? '' : 'transition-all duration-1000 ease-in-out'}`}
        style={{ 
            background: bgImage ? `url(${bgImage}) center/cover no-repeat` : getGradient(season)
        }}
    >
      {/* 1. Seasonal Overlay */}
      <SeasonalCanvas season={season} />

      {/* 2. Lyrics Overlay (Visible when player is hidden) */}
      <LyricsOverlay 
        lyrics={lyrics} 
        currentTime={currentTime} 
        isVisible={isPlayerHidden} 
      />

      {/* 3. Main Layout Container */}
      {/* Adjusted padding: pt-16 for header space, pb-28 to clear the new dock safely on mobile */}
      <div className="relative z-20 flex-1 flex flex-col items-center w-full h-full pointer-events-none pb-28 md:pb-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        
        {/* Header / Title Section */}
        {/* Removed conditional styling for isPlayerHidden to keep title visible */}
        <div 
            className="shrink-0 pt-16 md:pt-12 pb-2 w-full text-center pointer-events-auto z-30 transition-all duration-700"
        >
            <h1 className="text-5xl md:text-7xl font-normal text-white tracking-widest opacity-90 drop-shadow-lg inline-block relative hover:scale-105 transition-transform cursor-default" style={{ fontFamily: "'Londrina Sketch', cursive" }}>
              Beomedio 🎧
            </h1>
        </div>

        {/* Player Section */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0 pointer-events-auto relative perspective-[1000px]">
            {/* Player Wrapper */}
            <div 
                className={`w-full max-w-lg px-4 transform origin-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    isPlayerHidden 
                    ? 'opacity-0 scale-75 translate-y-20 blur-md pointer-events-none rotate-x-12' 
                    : 'opacity-100 scale-85 md:scale-100 translate-y-0 blur-0 rotate-x-0'
                }`}
            >
                <DoodleRadio 
                    media={displayMedia} 
                    onPlayStateChange={setIsPlaying}
                    onFileUpload={handleFileUpload}
                    onLyricsLoaded={setLyrics}
                    onTimeUpdate={setCurrentTime}
                    onTrackFinish={handleTrackFinish}
                    autoPlay={autoPlayNext}
                />
            </div>
        </div>
      </div>

      {/* 4. Controls (Unified Dock) */}
      <Controls 
        currentSeason={season} 
        setSeason={setSeason} 
        onBgUpload={handleBgUpload}
        isPlayerHidden={isPlayerHidden}
        onToggleVisibility={() => setIsPlayerHidden(!isPlayerHidden)}
      />

      {/* 5. Video Modal */}
      {currentMedia?.type === 'video' && (
        <VideoModal 
            url={currentMedia.url} 
            onClose={() => setPlaylist([])} 
            onEnded={handleTrackFinish}
        />
      )}

    </div>
  );
};

export default App;