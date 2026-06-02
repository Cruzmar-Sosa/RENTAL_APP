'use client';

import { useState } from 'react';
import { X, Play, Pause, Volume2, MapPin, Tag } from 'lucide-react';
import { POI } from '@/types';
import { buildImageUrl } from '@/lib/storageUtils';

interface POIDetailsModalProps {
  poi: POI | null;
  onClose: () => void;
}

export default function POIDetailsModal({ poi, onClose }: POIDetailsModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  if (!poi) return null;

  // Build public image URLs from gallery keys
  let images: string[] = [];
  if (poi.gallery) {
    try {
      const parsed = typeof poi.gallery === 'string' ? JSON.parse(poi.gallery) : poi.gallery;
      if (Array.isArray(parsed)) {
        images = parsed.map((img: string) => buildImageUrl(img)).filter(Boolean) as string[];
      }
    } catch (e) {
      console.error('Failed to parse POI gallery:', e);
    }
  }

  // Fallback image if gallery is empty
  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'];
  }

  const toggleAudio = () => {
    if (!poi.audioGuideUrl) return;

    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else {
      let currentAudio = audio;
      if (!currentAudio) {
        currentAudio = new Audio(poi.audioGuideUrl);
        setAudio(currentAudio);
        currentAudio.addEventListener('ended', () => setIsPlaying(false));
      }
      currentAudio.play();
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 flex flex-col md:flex-row max-h-[90vh] md:max-h-[70vh] animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Gallery / Images Panel */}
        <div className="w-full md:w-1/2 relative h-48 md:h-auto bg-gray-100 flex-shrink-0">
          <img 
            src={images[0]} 
            alt={poi.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 pointer-events-none" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-blue-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-blue-400/20">
              <Tag size={10} />
              {poi.category || 'Punto de Interés'}
            </span>
            <h2 className="text-2xl font-black tracking-tight drop-shadow">{poi.name}</h2>
          </div>
        </div>

        {/* Description / Audio Panel */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <MapPin size={14} className="text-gray-400" />
                <span>Coordenadas</span>
              </div>
              <p className="text-xs font-mono text-gray-500 bg-gray-50 dark:bg-gray-800/40 p-2 rounded-xl border border-gray-100 dark:border-gray-800 inline-block">
                Lat: {poi.latitude.toFixed(5)}, Lng: {poi.longitude.toFixed(5)}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider">Descripción</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {poi.description || 'No hay descripción disponible para este Punto de Interés.'}
              </p>
            </div>
          </div>

          {/* Audio Guide Controls (If URL exists) */}
          {poi.audioGuideUrl && (
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Volume2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider leading-none">Audioguía disponible</p>
                  <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-1 font-medium">Escucha la reseña histórica</p>
                </div>
              </div>
              <button 
                onClick={toggleAudio}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-lg hover:scale-105 cursor-pointer"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
