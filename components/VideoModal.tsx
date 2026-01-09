import React from 'react';
import { X } from 'lucide-react';

interface VideoModalProps {
  url: string;
  onClose: () => void;
  onEnded?: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ url, onClose, onEnded }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-xl p-6 transition-all duration-500">
      <div className="relative w-full max-w-4xl bg-white/40 border border-white/80 p-1 shadow-xl shadow-white/20 rounded-sm animate-in fade-in zoom-in duration-500">
        <button 
            onClick={onClose}
            className="absolute -top-12 right-0 w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors z-10 border border-slate-400/30 rounded-full bg-white/50 backdrop-blur-md"
        >
            <X size={18} strokeWidth={1.5} />
        </button>
        <div className="border border-white/60 p-4 bg-white/50 backdrop-blur-sm">
            <video 
                src={url} 
                controls 
                autoPlay 
                onEnded={onEnded}
                className="w-full h-auto max-h-[75vh] shadow-sm bg-black/5"
            >
                Your browser does not support the video tag.
            </video>
        </div>
        <div className="mt-4 text-center text-xs tracking-[0.2em] text-slate-500 uppercase font-light">
            Light Cinema Mode
        </div>
      </div>
    </div>
  );
};

export default VideoModal;