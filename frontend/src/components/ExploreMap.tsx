'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Station, Route, POI } from '@/types';
import { safeParsePolyline, isValidCoordinate } from '@/utils/geo';
import { MapErrorBoundary } from './MapErrorBoundary';

// Fix for default Leaflet icons in Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom HTML Icons using L.divIcon for Premium Look & Feel
const createStationIcon = (availableCount: number) => {
  const badgeColor = availableCount > 0 ? 'bg-emerald-500' : 'bg-rose-500';
  return L.divIcon({
    html: `
      <div class="flex items-center gap-1.5 bg-white border border-gray-150 rounded-full py-1 px-2 shadow-xl hover:scale-105 transition-transform duration-200 select-none">
        <div class="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center font-bold text-[10px]">
          📍
        </div>
        <div class="flex flex-col items-start leading-none pr-1">
          <span class="text-[10px] font-bold text-gray-800">${availableCount} Disponible${availableCount !== 1 ? 's' : ''}</span>
        </div>
        <span class="w-2 h-2 rounded-full ${badgeColor}"></span>
      </div>
    `,
    className: 'custom-station-icon-container',
    iconSize: [120, 36],
    iconAnchor: [60, 18],
  });
};

const createPoiIcon = (index: number, category?: string) => {
  let emoji = '⭐️';
  if (category?.toLowerCase().includes('hist')) emoji = '🏛️';
  else if (category?.toLowerCase().includes('parq') || category?.toLowerCase().includes('natur')) emoji = '🌳';
  else if (category?.toLowerCase().includes('rest') || category?.toLowerCase().includes('comi')) emoji = '🍴';
  else if (category?.toLowerCase().includes('teat') || category?.toLowerCase().includes('arte')) emoji = '🎭';

  return L.divIcon({
    html: `
      <div class="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white transition-transform hover:scale-110 duration-200">
        <span class="text-xs">${emoji}</span>
      </div>
    `,
    className: 'custom-poi-icon-container',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Map subcomponent to control camera focus and bounds
function MapController({ 
  polylinePositions, 
  focusPoi 
}: { 
  polylinePositions: [number, number][]; 
  focusPoi: POI | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (focusPoi && isValidCoordinate(focusPoi.latitude, focusPoi.longitude)) {
      map.flyTo([focusPoi.latitude, focusPoi.longitude], 17, { duration: 1.2 });
    } else if (polylinePositions && polylinePositions.length > 0) {
      try {
        const bounds = L.latLngBounds(polylinePositions);
        map.fitBounds(bounds, { padding: [50, 50], duration: 1.2 });
      } catch (err) {
        console.warn('⚠️ [MapController] Failed to fit bounds:', err);
      }
    }
  }, [polylinePositions, focusPoi, map]);

  return null;
}

interface ExploreMapProps {
  stations: Station[];
  selectedRoute: Route | null;
  selectedPoi: POI | null;
  onSelectPoi: (poi: POI) => void;
}

export default function ExploreMap({ 
  stations, 
  selectedRoute, 
  selectedPoi, 
  onSelectPoi 
}: ExploreMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const leonCenter: [number, number] = [12.434950279249428, -86.87813296257922]; // León, Nicaragua default

  // Parse polyline coordinates: prefer navigationPolyline, fallback to visualPolyline
  const parsedPolyline = (() => {
    if (!selectedRoute) return [];
    const nav = safeParsePolyline(selectedRoute.navigationPolyline);
    if (nav.length > 0) return nav;
    return safeParsePolyline(selectedRoute.visualPolyline);
  })();
  const polylinePositions: [number, number][] = parsedPolyline.map((p) => [p.lat, p.lng]);

  if (!isMounted) {
    return (
      <div className="w-full h-full min-h-[300px] bg-slate-900/10 animate-pulse rounded-2xl flex items-center justify-center border border-slate-200/50">
        <span className="text-slate-500 font-medium">Cargando mapa...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ borderRadius: 'inherit' }}>
      <MapErrorBoundary>
        <MapContainer
          center={leonCenter}
          zoom={14}
          zoomControl={false} // Disable zoom controls to fit clean layout, or place custom below
          style={{ height: '100%', width: '100%', borderRadius: 'inherit', zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Camera transitions */}
          <MapController polylinePositions={polylinePositions} focusPoi={selectedPoi} />

          {/* Route path */}
          {selectedRoute && polylinePositions.length > 0 && (
            <Polyline 
              positions={polylinePositions} 
              color="#2563eb" 
              weight={6} 
              opacity={0.8} 
              dashArray="1, 8" // dashed line for tourism feel
              lineCap="round"
            />
          )}

          {/* Stations */}
          {stations.map((station) => {
            if (!isValidCoordinate(station.latitude, station.longitude)) return null;
            
            const availableBikes = station.bikes?.filter(
              (b) => b.operationalStatus === 'AVAILABLE' && b.technicalStatus === 'OK'
            ).length || 0;

            return (
              <Marker 
                key={station.id} 
                position={[station.latitude, station.longitude]} 
                icon={createStationIcon(availableBikes)}
              >
                <Popup>
                  <div className="p-1 space-y-1">
                    <h3 className="font-extrabold text-sm text-gray-900 leading-tight">{station.name}</h3>
                    {station.address && <p className="text-[11px] text-gray-500">{station.address}</p>}
                    <div className="pt-2 border-t flex justify-between text-xs font-bold">
                      <span className="text-gray-500">Capacidad:</span>
                      <span className="text-gray-900">{station.capacity || 10}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-emerald-600">
                      <span>Disponibles:</span>
                      <span>{availableBikes} bicis</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Selected Route POIs */}
          {selectedRoute?.pois?.map((poi, idx) => {
            if (!isValidCoordinate(poi.latitude, poi.longitude)) return null;

            return (
              <Marker 
                key={poi.id} 
                position={[poi.latitude, poi.longitude]} 
                icon={createPoiIcon(idx, poi.category)}
                eventHandlers={{
                  click: () => onSelectPoi(poi)
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 max-w-[180px]">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider bg-blue-50 px-2 py-0.5 rounded-md leading-none">
                      {poi.category || 'POI'}
                    </span>
                    <h3 className="font-extrabold text-sm text-gray-900 leading-tight pt-1">{poi.name}</h3>
                    {poi.description && (
                      <p className="text-[11px] text-gray-500 line-clamp-2">{poi.description}</p>
                    )}
                    <button 
                      onClick={() => onSelectPoi(poi)}
                      className="w-full mt-2 text-center text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Ver detalles
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </MapErrorBoundary>
    </div>
  );
}
