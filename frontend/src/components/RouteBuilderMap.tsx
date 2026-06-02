'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Coordinate, isValidCoordinate } from '@/utils/geo';
import { MapErrorBoundary } from './MapErrorBoundary';
import { MapPin, Route as RouteIcon, RefreshCw, Maximize } from 'lucide-react';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Fix default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// ─── León, Nicaragua — Global default center ───
const LEON_NICARAGUA: [number, number] = [12.434950279249428, -86.87813296257922];

// ─── POI Icon Factory ───
const createPoiIcon = (index: number, total: number, isSequenced: boolean) => {
  let bg = '#64748b'; // default gray
  let label = '📍';

  if (isSequenced) {
    if (index === 0) {
      bg = '#16a34a'; // green — start
      label = '▶';
    } else if (index === total - 1) {
      bg = '#dc2626'; // red — end
      label = '■';
    } else {
      bg = '#d97706'; // amber — intermediate
      label = `${index + 1}`;
    }
  }

  return L.divIcon({
    html: `
      <div style="
        width:34px;height:34px;border-radius:50%;
        background:${bg};color:#fff;
        display:flex;align-items:center;justify-content:center;
        font-weight:900;font-size:${isSequenced && index > 0 && index < total - 1 ? '13' : '11'}px;
        border:3px solid #fff;
        box-shadow:0 3px 10px rgba(0,0,0,.3);
        transition: all 0.2s ease;
      ">
        ${label}
      </div>`,
    className: 'poi-custom-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

// ─── Coordinate comparison helper ───
function isCoordsEqual(a: Coordinate[], b: Coordinate[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((c, i) => c.lat === b[i].lat && c.lng === b[i].lng);
}

type BuilderMode = 'ROUTE' | 'POI';

interface POIData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category?: string;
  order: number;
  routeId: string;
}

interface RouteBuilderMapProps {
  /** Visual polyline coordinates (straight lines) */
  visualPolyline: Coordinate[];
  /** Navigation polyline coordinates (street-following) */
  navigationPolyline: Coordinate[];
  /** Callback when visual polyline changes */
  onVisualPolylineChange: (coords: Coordinate[]) => void;
  /** Callback when navigation polyline changes */
  onNavigationPolylineChange: (coords: Coordinate[]) => void;
  /** Callback when user click-places a POI on the map */
  onPoiPlaced?: (coord: Coordinate) => void;
  /** Callback when user finishes dragging a POI on the map */
  onPoiDrag?: (poiId: string, latlng: L.LatLng) => void;
  /** Existing POIs to display on the map */
  pois?: POIData[];
  /** Map height */
  height?: string;
}

// ─── Map click handler ───
function MapClickHandler({
  mode,
  onPoiClick,
}: {
  mode: BuilderMode;
  onPoiClick: (coord: Coordinate) => void;
}) {
  useMapEvents({
    click(e) {
      if (mode === 'POI') {
        const coord: Coordinate = {
          lat: Math.round(e.latlng.lat * 1000000) / 1000000,
          lng: Math.round(e.latlng.lng * 1000000) / 1000000,
        };
        onPoiClick(coord);
      }
    },
  });
  return null;
}

// ─── Safe fitBounds controller ───
function FitBoundsController({
  trigger,
  coordinates,
}: {
  trigger: number;
  coordinates: Coordinate[];
}) {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0 && coordinates.length > 0) {
      const valid = coordinates.filter(
        (c) =>
          isValidCoordinate(c.lat, c.lng) &&
          !isNaN(c.lat) &&
          !isNaN(c.lng) &&
          isFinite(c.lat) &&
          isFinite(c.lng)
      );
      if (valid.length === 0) return;
      try {
        const bounds = L.latLngBounds(
          valid.map((c) => [c.lat, c.lng] as [number, number])
        );
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
        }
      } catch (err) {
        console.warn('⚠️ [FitBoundsController] fitBounds failed:', err);
      }
    }
  }, [trigger, coordinates, map]);
  return null;
}

// ─── Main Component ───
export default function RouteBuilderMap({
  visualPolyline,
  navigationPolyline,
  onVisualPolylineChange,
  onNavigationPolylineChange,
  onPoiPlaced,
  onPoiDrag,
  pois = [],
  height = '450px',
}: RouteBuilderMapProps) {
  const [mode, setMode] = useState<BuilderMode>('POI');
  const queryClient = useQueryClient();
  const [fitTrigger, setFitTrigger] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [sequencedPoiIds, setSequencedPoiIds] = useState<string[]>([]);
  const [isRouting, setIsRouting] = useState(false);

  // Refs for debounce/abort/deduplication
  const lastPoiCoordsRef = useRef<string>('');
  const routingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Sync sequencedPoiIds from POIs (guarded against identical state) ──
  useEffect(() => {
    const sorted = [...pois]
      .filter((p) => p.order >= 0)
      .sort((a, b) => a.order - b.order);
    const newIds = sorted.map((p) => p.id);

    setSequencedPoiIds((prev) => {
      if (
        prev.length === newIds.length &&
        prev.every((id, i) => id === newIds[i])
      ) {
        return prev; // Identical — no state change, no re-render
      }
      return newIds;
    });
  }, [pois]);

  // ── Route recalculation (ref-guarded + debounced 500ms + AbortController) ──
  useEffect(() => {
    if (!isMounted) return;

    const sorted = [...pois]
      .filter((p) => p.order >= 0)
      .sort((a, b) => a.order - b.order);
    const coords: Coordinate[] = sorted.map((p) => ({
      lat: p.latitude,
      lng: p.longitude,
    }));
    const coordsKey = JSON.stringify(coords);

    // Skip if identical to last processed coordinates
    if (coordsKey === lastPoiCoordsRef.current) return;
    lastPoiCoordsRef.current = coordsKey;

    // Clear previous timer and abort in-flight request
    if (routingTimerRef.current) clearTimeout(routingTimerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (coords.length < 2) {
      onVisualPolylineChange([]);
      onNavigationPolylineChange([]);
      setIsRouting(false);
      return;
    }

    // Immediately update visual polyline (straight lines between POIs)
    onVisualPolylineChange(coords);
    setIsRouting(true);

    // Debounce the routing API call by 500ms
    routingTimerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      api
        .post(
          '/routes/directions',
          { coordinates: coords },
          { signal: controller.signal }
        )
        .then((res) => {
          if (!controller.signal.aborted) {
            const navCoords: Coordinate[] = res.data.coordinates || coords;
            onNavigationPolylineChange(navCoords);
            setIsRouting(false);
          }
        })
        .catch((err: any) => {
          if (err.name === 'AbortError' || err.name === 'CanceledError') return;
          console.warn('⚠️ Routing API failed, falling back to straight lines:', err);
          if (!controller.signal.aborted) {
            onNavigationPolylineChange(coords);
            setIsRouting(false);
            toast.info(
              'No fue posible calcular la ruta vial. Mostrando ruta aproximada.'
            );
          }
        });
    }, 500);

    return () => {
      if (routingTimerRef.current) clearTimeout(routingTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
    // Only depend on pois and isMounted — callbacks are stable setState refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pois, isMounted]);

  // ── Handlers ──

  const handlePoiPlace = useCallback(
    (coord: Coordinate) => {
      onPoiPlaced?.(coord);
    },
    [onPoiPlaced]
  );

  const handlePoiClick = async (poiId: string) => {
    if (mode !== 'ROUTE') return;
    if (sequencedPoiIds.includes(poiId)) return;

    const newSequence = [...sequencedPoiIds, poiId];
    setSequencedPoiIds(newSequence);

    // Build orders — auto-save immediately
    const orders = newSequence.map((id, index) => ({ id, order: index }));
    const remaining = pois.filter((p) => !newSequence.includes(p.id));
    remaining.forEach((p) => {
      orders.push({ id: p.id, order: -1 });
    });

    try {
      if (pois.length > 0) {
        await api.put(`/routes/${pois[0].routeId}/pois/reorder`, { orders });
        queryClient.invalidateQueries({ queryKey: ['routes'] });
      }
    } catch (err) {
      console.error('⚠️ Error sequencing POI:', err);
      toast.error('Error al guardar el orden del POI');
    }
  };

  const handleResetSequence = async () => {
    setSequencedPoiIds([]);
    onVisualPolylineChange([]);
    onNavigationPolylineChange([]);
    lastPoiCoordsRef.current = ''; // Allow re-routing after reset
    setIsRouting(false);

    const orders = pois.map((p) => ({ id: p.id, order: -1 }));
    try {
      if (pois.length > 0) {
        await api.put(`/routes/${pois[0].routeId}/pois/reorder`, { orders });
        queryClient.invalidateQueries({ queryKey: ['routes'] });
        toast.success('Orden y ruta limpiados correctamente');
      }
    } catch (err) {
      console.error('⚠️ Error resetting POI sequence:', err);
      toast.error('Error al resetear el orden');
    }
  };

  const handleFitBounds = () => {
    setFitTrigger((prev) => prev + 1);
  };

  // ── Derived render data ──
  const visualPositions: [number, number][] = visualPolyline.map((c) => [
    c.lat,
    c.lng,
  ]);
  const navigationPositions: [number, number][] = navigationPolyline.map(
    (c) => [c.lat, c.lng]
  );

  const canUseRouteMode = pois.length >= 2;

  if (!isMounted) {
    return (
      <div
        className="w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center border border-slate-200/50"
        style={{ height }}
      >
        <span className="text-slate-400 font-medium text-sm">
          Cargando editor de ruta...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Mode toggle */}
        <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              if (!canUseRouteMode) return;
              setMode('ROUTE');
            }}
            disabled={!canUseRouteMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
              mode === 'ROUTE' && canUseRouteMode
                ? 'bg-blue-600 text-white shadow-sm'
                : canUseRouteMode
                ? 'text-slate-500 hover:text-slate-700'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title={
              canUseRouteMode
                ? 'Modo Ruta: Click POIs para definir orden'
                : 'Necesitas al menos 2 POIs para construir una ruta'
            }
          >
            <RouteIcon size={12} /> Route Mode
          </button>
          <button
            type="button"
            onClick={() => setMode('POI')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
              mode === 'POI'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapPin size={12} /> POI Mode
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Actions */}
        {mode === 'ROUTE' && (
          <button
            type="button"
            onClick={handleResetSequence}
            disabled={pois.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 transition disabled:opacity-30 cursor-pointer"
            title="Reset sequence"
          >
            <RefreshCw size={12} /> Reset Order
          </button>
        )}
        <button
          type="button"
          onClick={handleFitBounds}
          disabled={pois.length === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition disabled:opacity-30 cursor-pointer"
          title="Fit bounds"
        >
          <Maximize size={12} /> Fit View
        </button>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-3 text-[11px] font-bold text-slate-500">
          <span>{pois.length} POIs</span>
          {isRouting && (
            <>
              <span className="h-3 w-px bg-slate-200" />
              <span className="text-blue-500 animate-pulse">
                Calculando ruta...
              </span>
            </>
          )}
        </div>
      </div>

      {/* Mode hint */}
      <div
        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${
          mode === 'ROUTE'
            ? 'bg-blue-50 text-blue-600 border-blue-100'
            : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}
      >
        {mode === 'ROUTE'
          ? !canUseRouteMode
            ? '⚠️ Necesitas al menos 2 POIs para construir una ruta. Cambia a POI Mode para agregar puntos.'
            : '🗺️ Route Mode: Click the POI markers in sequence to define the navigation path.'
          : '📍 POI Mode: Click the map to place a new POI marker. Drag markers to relocate.'}
      </div>

      {/* Map */}
      <div
        className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
        style={{ height }}
      >
        <MapErrorBoundary>
          <MapContainer
            center={
              pois.length > 0
                ? [pois[0].latitude, pois[0].longitude]
                : LEON_NICARAGUA
            }
            zoom={14}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler mode={mode} onPoiClick={handlePoiPlace} />
            <FitBoundsController
              trigger={fitTrigger}
              coordinates={pois.map((p) => ({
                lat: p.latitude,
                lng: p.longitude,
              }))}
            />

            {/* Navigation polyline (street-following, solid when resolved) */}
            {navigationPositions.length > 1 && (
              <Polyline
                positions={navigationPositions}
                color="#2563eb"
                weight={6}
                opacity={0.85}
              />
            )}

            {/* Visual polyline (straight-line, dashed — shown while routing or as fallback) */}
            {visualPositions.length > 1 && (
              <Polyline
                positions={visualPositions}
                color={isRouting ? '#93c5fd' : '#3b82f6'}
                weight={isRouting ? 3 : 2}
                opacity={isRouting ? 0.8 : 0.5}
                dashArray={isRouting ? '8, 12' : '6, 6'}
              />
            )}

            {/* POI markers */}
            {pois.map((poi) => {
              if (!isValidCoordinate(poi.latitude, poi.longitude)) return null;

              const isSequenced = sequencedPoiIds.includes(poi.id);
              const orderIdx = sequencedPoiIds.indexOf(poi.id);
              const totalSequenced = sequencedPoiIds.length;

              return (
                <Marker
                  key={`poi-marker-${poi.id}`}
                  position={[poi.latitude, poi.longitude]}
                  icon={createPoiIcon(orderIdx, totalSequenced, isSequenced)}
                  draggable={mode === 'POI'}
                  eventHandlers={{
                    click: () => {
                      if (mode === 'ROUTE') {
                        handlePoiClick(poi.id);
                      }
                    },
                    dragend: (e) => {
                      if (mode === 'POI') {
                        onPoiDrag?.(poi.id, e.target.getLatLng());
                      }
                    },
                  }}
                >
                  <Popup>
                    <div className="text-center p-1 space-y-1">
                      <p className="font-extrabold text-xs text-slate-800">
                        {poi.name}
                      </p>
                      <p className="text-[9px] text-gray-500 uppercase font-bold">
                        {poi.category || 'POI'}
                      </p>
                      {isSequenced && (
                        <p
                          className={`text-[10px] font-black rounded py-0.5 px-1 inline-block ${
                            orderIdx === 0
                              ? 'text-green-700 bg-green-50'
                              : orderIdx === totalSequenced - 1
                              ? 'text-red-700 bg-red-50'
                              : 'text-amber-600 bg-amber-50'
                          }`}
                        >
                          {orderIdx === 0
                            ? '▶ Inicio'
                            : orderIdx === totalSequenced - 1
                            ? '■ Final'
                            : `Parada #${orderIdx + 1}`}
                        </p>
                      )}
                      {mode === 'POI' && (
                        <p className="text-[9px] text-slate-400 font-medium">
                          Arrastra para mover
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </MapErrorBoundary>
      </div>
    </div>
  );
}
