import React, { useState, useEffect } from 'react';
import { Season, MediaData } from './types';
import SeasonalCanvas from './components/SeasonalCanvas';
import DoodleRadio from './components/DoodleRadio';
import VideoModal from './components/VideoModal';
import Controls from './components/Controls';

const App: React.FC = () => {
  const [season, setSeason] = useState<Season>(Season.Spring);
  
  // Playlist State
  const [playlist, setPlaylist] = useState<MediaData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [bgImage, setBgImage] = useState<string>('');
  
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

      {/* 2. Main Layout Container */}
      {/* Adjusted padding: pt-16 for header space, pb-28 to clear the new dock safely on mobile */}
      <div className="relative z-20 flex-1 flex flex-col items-center w-full h-full pointer-events-none pb-28 md:pb-0">
        
        {/* Header / Title Section */}
        {/* pt-16 md:pt-12: Balanced top spacing */}
        <div className="shrink-0 pt-16 md:pt-12 pb-2 w-full text-center pointer-events-auto z-30 transition-all duration-500">
            <h1 className="text-5xl md:text-7xl font-normal text-white tracking-widest opacity-90 drop-shadow-lg inline-block relative hover:scale-105 transition-transform cursor-default" style={{ fontFamily: "'Londrina Sketch', cursive" }}>
              Beomedio 🎧
            </h1>
        </div>

        {/* Player Section */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0 pointer-events-auto relative">
            {/* Player Wrapper */}
            {/* Kept scale-85 for mobile to ensure no overlap, but centering should be better with new flex spacing */}
            <div className="w-full max-w-lg px-4 transform scale-85 md:scale-100 origin-center transition-transform duration-500 ease-out">
                <DoodleRadio 
                    media={displayMedia} 
                    onPlayStateChange={setIsPlaying}
                    onFileUpload={handleFileUpload}
                    onTrackFinish={handleTrackFinish}
                    autoPlay={autoPlayNext}
                />
            </div>
        </div>
      </div>

      {/* 3. Controls (Unified Dock) */}
      <Controls 
        currentSeason={season} 
        setSeason={setSeason} 
        onBgUpload={handleBgUpload}
      />

      {/* 4. Video Modal */}
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