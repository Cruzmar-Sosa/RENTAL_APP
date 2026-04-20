'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';

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

  useEffect(() => {
    // Definimos URL base vacia si no existe, o tomamos de entorno
    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';

    const s = io(`${wsUrl}/tracking`, {
      path: '/socket.io',
      // FUNDAMENTAL: Bypasses the HTML warning page from ngrok free tier
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
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
        [data.bikeId]: data,
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
    <MapContainer
      center={defaultCenter}
      zoom={14}
      style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render selected route */}
      {selectedRoute && polylinePositions.length > 0 && (
        <Polyline positions={polylinePositions} color="blue" weight={5} opacity={0.6} />
      )}

      {/* Render bike locations */}
      {Object.values(locations).map((loc) => (
        <Marker key={loc.bikeId} position={[loc.lat, loc.lng]} icon={bikeIcon}>
          <Popup>
            <div className="font-bold">Bike #{loc.bikeId.slice(0, 8)}</div>
            <div className="text-xs">Speed: {loc.speed} km/h</div>
            <div className="text-[10px] text-gray-500">Updated: {new Date(loc.timestamp).toLocaleTimeString()}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
