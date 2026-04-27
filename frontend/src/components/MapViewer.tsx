'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';

// Fix for default Leaflet icons in Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icon for bikes
const bikeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png', // A free bike icon URL
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export interface LiveLocation {
  bikeId: string;
  lat: number;
  lng: number;
  speed: number;
  timestamp: string;
  connection?: 'connected' | 'disconnected';
}

function FocusController({ locations, selectedBikeId }: { locations: Record<string, LiveLocation>, selectedBikeId: string | null }) {
  const map = useMap();
  const loc = selectedBikeId ? locations[selectedBikeId] : null;

  useEffect(() => {
    if (loc) {
      map.flyTo([loc.lat, loc.lng], 17, { duration: 1.2 });
    }
  }, [selectedBikeId, loc?.lat, loc?.lng, map]);
  return null;
}

interface MapViewerProps {
  initialBikes: any[];
  onSocketStatusChange: (connected: boolean) => void;
  selectedRoute?: {
    id: string;
    polyline: string; // JSON string of {lat, lng}[]
  } | null;
}

export default function MapViewer({ initialBikes, onSocketStatusChange, selectedRoute }: MapViewerProps) {
  const [locations, setLocations] = useState<Record<string, LiveLocation>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);

  useEffect(() => {
    // Definimos URL base vacia si no existe, o tomamos de entorno
    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

    const s = io(`${wsUrl}/tracking`, {
    path: '/socket.io',
    transports: ['websocket'], // opcional pero recomendado en prod
  });

    console.log("📡 MAPVIEWER INICIANDO CONEXIÓN A:", `${wsUrl}/tracking`);
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
      setLocations((prev) => ({
        ...prev,
        [data.bikeId]: {
          ...(prev[data.bikeId] || {}),
          ...data
        },
      }));
    });

    return () => {
      s.disconnect();
    };
  }, [onSocketStatusChange]); // Removed initialBikes to fix infinite reconnect loop

  useEffect(() => {
    // Populate initial locations based on latest known bikes if needed
    if (initialBikes && initialBikes.length > 0) {
       // Mock or populate from real initial data
    }
  }, [initialBikes]);

  const defaultCenter: [number, number] = [12.434318323316706, -86.88048488156197]; // Leon, Gto fallback Coordinates
  const parsedPolyline = selectedRoute?.polyline ? JSON.parse(selectedRoute.polyline) : null;
  const polylinePositions = parsedPolyline ? parsedPolyline.map((p: any) => [p.lat, p.lng]) : [];

  return (
    <div className="relative w-full h-full" style={{ borderRadius: 'inherit' }}>
      
      {/* UI Overlay para Follow Mode */}
      <div className="absolute top-4 right-4 z-[400] bg-white rounded-xl shadow-lg border p-3 flex flex-col gap-2 max-h-60 overflow-y-auto min-w-[200px]">
        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-1">Active In-Use Units</h4>
        {Object.values(locations).map(loc => (
          <button 
            key={loc.bikeId} 
            onClick={() => setSelectedBikeId(selectedBikeId === loc.bikeId ? null : loc.bikeId)}
            className={cn(
              "text-sm font-medium text-left px-3 py-2 rounded-lg transition hover:bg-gray-50 flex items-center justify-between", 
              selectedBikeId === loc.bikeId && "bg-blue-50 text-blue-700 border border-blue-100"
            )}
          >
            Bike #{loc.bikeId.slice(0,6)} 
            <span className={cn(
              "inline-block w-2.5 h-2.5 rounded-full shadow-inner", 
              loc.connection === 'connected' ? 'bg-green-500' : 'bg-gray-400 animate-pulse'
            )} />
          </button>
        ))}
        {Object.keys(locations).length === 0 && (
          <span className="text-sm text-gray-400 italic px-1">Sin unidades activas</span>
        )}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Focus dynamic control */}
        <FocusController locations={locations} selectedBikeId={selectedBikeId} />

        {/* Render selected route */}
        {selectedRoute && polylinePositions.length > 0 && (
          <Polyline positions={polylinePositions} color="blue" weight={5} opacity={0.6} />
        )}

        {/* Render bike locations */}
        {Object.values(locations).map((loc) => (
          <div key={loc.bikeId}>
            <CircleMarker 
              center={[loc.lat, loc.lng]} 
              radius={24} 
              pathOptions={{
                color: loc.connection === 'connected' ? '#22c55e' : '#9ca3af',
                fillColor: loc.connection === 'connected' ? '#22c55e' : '#9ca3af',
                fillOpacity: 0.2,
                weight: 2,
                opacity: 0.6
              }}
            />
            <Marker position={[loc.lat, loc.lng]} icon={bikeIcon}>
              <Popup>
                <div className="font-bold">Bike #{loc.bikeId.slice(0, 8)}</div>
                <div className="text-xs">Velocidad: {loc.speed} km/h</div>
                <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold">
                  [{loc.connection === 'connected' ? 'ONLINE' : 'OFFLINE'}]
                </div>
                <div className="text-[10px] text-gray-400">Actualizado: {new Date(loc.timestamp).toLocaleTimeString()}</div>
              </Popup>
            </Marker>
          </div>
        ))}
      </MapContainer>
    </div>
  );
}
