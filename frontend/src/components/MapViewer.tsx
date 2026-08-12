'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';
import { safeParsePolyline, isValidCoordinate } from '@/utils/geo';
import { MapErrorBoundary } from './MapErrorBoundary';

// Fix for default Leaflet icons in Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icon for bikes
const bikeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export interface LiveLocation {
  bikeId: string;
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  batteryLevel?: number;
  timestamp: string;
  connection?: 'connected' | 'disconnected';
}

/**
 * Controller to handle flyTo for selected bike or auto-fitting bounds for active units
 */
function ViewportController({
  locations,
  selectedBikeId,
}: {
  locations: Record<string, LiveLocation>;
  selectedBikeId: string | null;
}) {
  const map = useMap();
  const locList = Object.values(locations).filter((l) => isValidCoordinate(l.lat, l.lng));

  useEffect(() => {
    // 1. Focus on specific selected unit
    if (selectedBikeId && locations[selectedBikeId]) {
      const loc = locations[selectedBikeId];
      if (isValidCoordinate(loc.lat, loc.lng)) {
        map.flyTo([loc.lat, loc.lng], 17, { duration: 1.2 });
        return;
      }
    }

    // 2. Auto-fit bounds for active units if no specific unit is locked
    if (!selectedBikeId && locList.length > 0) {
      if (locList.length === 1 && locList[0]) {
        map.flyTo([locList[0].lat, locList[0].lng], 16, { duration: 1.0 });
      } else {
        const bounds = L.latLngBounds(locList.map((l) => [l.lat, l.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [selectedBikeId, JSON.stringify(locList.map((l) => `${l.bikeId}:${l.lat}:${l.lng}`)), map]);

  return null;
}

/**
 * Smooth Animated Marker (Uber / PedidosYa LERP Interpolation)
 */
function SmoothMarker({ loc }: { loc: LiveLocation }) {
  const [currentPos, setCurrentPos] = useState<[number, number]>([loc.lat, loc.lng]);
  const animRef = useRef<number | null>(null);
  const startPosRef = useRef<[number, number]>([loc.lat, loc.lng]);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const targetPos: [number, number] = [loc.lat, loc.lng];
    const startPos = currentPos;
    startPosRef.current = startPos;
    startTimeRef.current = Date.now();
    const duration = 1500; // Smooth 1.5s transition

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic interpolation
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const lat = startPosRef.current[0] + (targetPos[0] - startPosRef.current[0]) * easeProgress;
      const lng = startPosRef.current[1] + (targetPos[1] - startPosRef.current[1]) * easeProgress;

      setCurrentPos([lat, lng]);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [loc.lat, loc.lng]);

  return (
    <>
      <CircleMarker
        center={currentPos}
        radius={24}
        pathOptions={{
          color: loc.connection === 'connected' ? '#22c55e' : '#9ca3af',
          fillColor: loc.connection === 'connected' ? '#22c55e' : '#9ca3af',
          fillOpacity: 0.2,
          weight: 2,
          opacity: 0.6,
        }}
      />
      <Marker position={currentPos} icon={bikeIcon}>
        <Popup>
          <div className="font-bold">Bike #{loc.bikeId.slice(0, 8)}</div>
          <div className="text-xs">Velocidad: {loc.speed ?? 0} km/h</div>
          {loc.batteryLevel !== undefined && (
            <div className="text-xs">Batería: 🔋 {loc.batteryLevel}%</div>
          )}
          <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold">
            [{loc.connection === 'connected' ? 'ONLINE' : 'OFFLINE'}]
          </div>
          <div className="text-[10px] text-gray-400">
            Actualizado: {new Date(loc.timestamp).toLocaleTimeString()}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

interface MapViewerProps {
  initialBikes: any[];
  onSocketStatusChange: (connected: boolean) => void;
  selectedRoute?: {
    id: string;
    visualPolyline?: any;
    navigationPolyline?: any;
  } | null;
}

export function getFreshnessState(loc: LiveLocation): 'LIVE' | 'STALE' | 'OFFLINE' {
  if (loc.connection === 'disconnected') return 'OFFLINE';
  const ageMs = Date.now() - new Date(loc.timestamp).getTime();
  if (isNaN(ageMs) || ageMs > 45000) return 'OFFLINE';
  if (ageMs > 15000) return 'STALE';
  return 'LIVE';
}

export default function MapViewer({ initialBikes, onSocketStatusChange, selectedRoute }: MapViewerProps) {
  const [locations, setLocations] = useState<Record<string, LiveLocation>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const rawWsUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://192.168.1.77:3001';
    const wsUrl = rawWsUrl.startsWith('http') ? rawWsUrl : `http://${rawWsUrl}`;

    const s = io(`${wsUrl}/tracking`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'], // Fallback enabled
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    console.log('📡 MAPVIEWER INICIANDO CONEXIÓN A:', `${wsUrl}/tracking`);
    setSocket(s);

    s.on('connect', () => {
      console.log('🟢 MAPVIEWER SOCKET ESTABLECIDO');
      onSocketStatusChange(true);
      s.emit('join_dashboard');
    });

    s.on('disconnect', () => {
      onSocketStatusChange(false);
    });

    s.on('location_updated', (data: LiveLocation) => {
      if (data.bikeId && isValidCoordinate(data.lat, data.lng)) {
        setLocations((prev) => ({
          ...prev,
          [data.bikeId]: {
            ...(prev[data.bikeId] || {}),
            ...data,
          },
        }));
      }
    });

    return () => {
      s.disconnect();
    };
  }, [onSocketStatusChange]);

  const defaultCenter: [number, number] = [12.434950279249428, -86.87813296257922]; // León default
  const parsedPolyline = safeParsePolyline(selectedRoute?.navigationPolyline || selectedRoute?.visualPolyline);
  const polylinePositions = parsedPolyline.map((p) => [p.lat, p.lng] as [number, number]);

  if (!isMounted) {
    return (
      <div className="w-full h-full min-h-[300px] bg-slate-900/10 animate-pulse rounded-2xl flex items-center justify-center border border-slate-200/50">
        <span className="text-slate-500 font-medium">Cargando mapa...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ borderRadius: 'inherit' }}>
      {/* UI Overlay para Follow Mode & Freshness State */}
      <div className="absolute top-4 right-4 z-400 bg-white rounded-xl shadow-lg border p-3 flex flex-col gap-2 max-h-60 overflow-y-auto min-w-[220px]">
        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-1">Active In-Use Units</h4>
        {Object.values(locations).map((loc) => {
          const freshness = getFreshnessState(loc);
          return (
            <button
              key={loc.bikeId}
              onClick={() => setSelectedBikeId(selectedBikeId === loc.bikeId ? null : loc.bikeId)}
              className={cn(
                'text-sm font-medium text-left px-3 py-2 rounded-lg transition hover:bg-gray-50 flex items-center justify-between gap-2 border',
                selectedBikeId === loc.bikeId ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' : 'border-transparent'
              )}
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-800">Bike #{loc.bikeId.slice(0, 6)}</span>
                <span className="text-[10px] text-gray-400">
                  {loc.speed ?? 0} km/h {loc.batteryLevel !== undefined ? `• 🔋 ${loc.batteryLevel}%` : ''}
                </span>
              </div>
              <span
                className={cn(
                  'text-[9px] font-black uppercase px-2 py-0.5 rounded-full border',
                  freshness === 'LIVE' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  freshness === 'STALE' && 'bg-amber-50 text-amber-700 border-amber-200',
                  freshness === 'OFFLINE' && 'bg-slate-100 text-slate-500 border-slate-200'
                )}
              >
                {freshness}
              </span>
            </button>
          );
        })}
        {Object.keys(locations).length === 0 && (
          <span className="text-sm text-gray-400 italic px-1">Sin unidades activas</span>
        )}
      </div>

      <MapErrorBoundary>
        <MapContainer
          center={defaultCenter}
          zoom={14}
          style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Viewport controller for auto-center & flyTo */}
          <ViewportController locations={locations} selectedBikeId={selectedBikeId} />

          {/* Render selected route */}
          {selectedRoute && polylinePositions.length > 0 && (
            <Polyline positions={polylinePositions} color="blue" weight={5} opacity={0.6} />
          )}

          {/* Render smooth animated bike markers */}
          {Object.values(locations).map((loc) => {
            if (!isValidCoordinate(loc.lat, loc.lng)) return null;
            return <SmoothMarker key={loc.bikeId} loc={loc} />;
          })}
        </MapContainer>
      </MapErrorBoundary>
    </div>
  );
}
