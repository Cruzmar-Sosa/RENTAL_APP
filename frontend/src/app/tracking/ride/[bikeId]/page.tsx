'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { MapPin, Navigation, Signal, SignalZero, StopCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function MobileRideTracking() {
  const params = useParams();
  const bikeId = params.bikeId as string;
  
  const [isTracking, setIsTracking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [networkState, setNetworkState] = useState<'offline' | 'connecting' | 'online' | 'fallback'>('offline');
  const [error, setError] = useState<string | null>(null);
  
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lng: number} | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    setNetworkState('connecting');
    console.log('📡 SOCKET ATTEMPTING HANDSHAKE:', `${wsUrl}/tracking`);

    const s = io(`${wsUrl}/tracking`, {
    path: '/socket.io',
    transports: ['websocket'], // opcional pero recomendado en prod
  });
    
    socketRef.current = s;

    s.on('connect', () => {
      console.log('🟢 SOCKET CONNECTED NATIVELY (101)');
      setConnected(true);
      setNetworkState('online');
    });

    s.on('disconnect', (reason) => {
      console.log('🔴 SOCKET DISCONNECTED:', reason);
      setConnected(false);
      setNetworkState('connecting');
    });

    s.on('connect_error', (err) => {
      console.error('❌ SOCKET ERROR:', err.message);
      setNetworkState('offline');
    });

    const handleTrackingError = (err: { message: string }) => {
      console.error('❌ TRACKING ERROR:', err.message);
      toast.error(err.message || 'Bicicleta en uso', { duration: 5000 });
      // Force stop local tracking
      setIsTracking(false);
      setNetworkState('offline');
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    s.on('tracking_error', handleTrackingError);

    return () => {
      s.off('tracking_error', handleTrackingError);
      s.disconnect();
      socketRef.current = null;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const handleStartTracking = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    try {
      await api.get(`/bikes/${bikeId}`);
    } catch (e: any) {
      // safe mute
    }

    setIsTracking(true);
    setError(null);
    toast.success('🚴‍♂️ Enviando ubicación en tiempo real');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const currentSpeedKmH = speed ? (speed * 3.6).toFixed(1) : 0;
        
        setCurrentPosition({ lat: latitude, lng: longitude });
        setCurrentSpeed(Number(currentSpeedKmH));

        // FUNDAMENTAL: Check live reference property, not stale closure
        if (socketRef.current && socketRef.current.connected) {
          console.log('📍 EMITTING GPS payload:', { lat: latitude, lng: longitude, speed: currentSpeedKmH });
          setNetworkState('online');
          socketRef.current.emit('update_location', {
            bikeId,
            lat: latitude,
            lng: longitude,
            speed: Number(currentSpeedKmH),
          });
        } else {
          console.warn('⚠️ USING REST FALLBACK (Socket dead)');
          setNetworkState('fallback');
          
          api.post('/tracking', {
            bikeId,
            latitude,
            longitude,
            speed: Number(currentSpeedKmH),
          }).catch(() => { /* mute error */ });
        }
      },
      (err) => {
        setError(err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // throttling battery
      }
    );
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    toast.info('Tracking detenido');
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('stop_tracking', { bikeId });
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col justify-between items-center sm:justify-center p-6 sm:p-12 overflow-y-auto w-full h-[100dvh]">
      <div className="w-full max-w-sm flex flex-col items-center flex-1 mt-8">
        <h1 className="text-3xl font-black text-center tracking-tight">Active Ride</h1>
        <p className="text-gray-500 font-medium text-center mt-2">Bike #{bikeId?.slice(0, 6) || 'Unknown'}</p>

        {error && (
           <div className="bg-red-50 text-red-600 p-4 rounded-2xl w-full mt-6 text-sm text-center border border-red-100 shadow-sm">
             Access Error: {error}
           </div>
        )}

        <div className="bg-white border rounded-[2.5rem] w-full p-8 mt-10 shadow-2xl flex flex-col items-center relative overflow-hidden">
           {/* Dynamic UX Banner */}
           <div className={cn(
             "absolute top-4 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
             networkState === 'online' ? "bg-green-50 text-green-700 border-green-100" :
             networkState === 'fallback' ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
             networkState === 'connecting' ? "bg-blue-50 text-blue-700 border-blue-100" :
             "bg-red-50 text-red-700 border-red-100"
           )}>
             {networkState === 'online' && <><Signal size={12} className="animate-pulse" /> Live System Active</>}
             {networkState === 'fallback' && <><RefreshCw size={12} className="animate-spin" /> Retrying Socket...</>}
             {networkState === 'connecting' && <><SignalZero size={12} className="animate-pulse" /> Handshake...</>}
             {networkState === 'offline' && <><SignalZero size={12} /> Offline</>}
           </div>

           <div className={cn(
             "w-32 h-32 rounded-full flex items-center justify-center mt-6 transition-colors shadow-inner border-8",
             isTracking ? "bg-blue-50 text-blue-500 border-blue-100" : "bg-gray-50 text-gray-400 border-gray-100"
           )}>
             <Navigation size={48} className={cn(isTracking && "animate-pulse")} />
           </div>
           
           <h2 className="text-6xl font-black mt-8 text-black tabular-nums tracking-tighter">
             {currentSpeed}
           </h2>
           <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">KM / H</p>

           <div className="w-full h-px bg-gray-100 my-8"></div>

           <div className="w-full flex justify-between items-center px-4">
             <div className="flex items-center gap-2 text-gray-500">
               <MapPin size={16} />
               <span className="text-xs font-medium">
                 {currentPosition 
                   ? `${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}`
                   : 'Waiting for GPS...'}
               </span>
             </div>
           </div>
        </div>

        <div className="w-full mt-auto mb-8 sm:mt-12 flex justify-center">
          {!isTracking ? (
            <button 
              onClick={handleStartTracking}
              className="w-full h-16 bg-black text-white hover:bg-gray-800 transition active:scale-95 shadow-2xl shadow-black/20 font-black text-lg flex items-center justify-center gap-3"
              style={{ borderRadius: '2rem' }}
            >
              Start GPS Tracking
            </button>
          ) : (
            <button 
              onClick={handleStopTracking}
              className="w-full h-16 bg-red-500 hover:bg-red-600 text-white transition active:scale-95 shadow-2xl shadow-red-500/20 font-black text-lg flex items-center justify-center gap-3"
              style={{ borderRadius: '2rem' }}
            >
              <StopCircle size={24} /> Stop Tracking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
