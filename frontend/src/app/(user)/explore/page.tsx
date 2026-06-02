'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Compass, Search, MapPin, Clock, Route as RouteIcon, Star, Filter, Heart } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Route, Station, POI } from '@/types';
import { buildImageUrl } from '@/lib/storageUtils';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamic import with no SSR for Leaflet ExploreMap
const ExploreMap = dynamic(() => import('@/components/ExploreMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">
      <LoadingScreen message="Cargando mapa turístico..." />
    </div>
  ),
});

// POI Details Modal
import POIDetailsModal from '@/components/POIDetailsModal';

export default function ExplorePage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [distanceFilter, setDistanceFilter] = useState<string>('ALL'); // ALL, SHORT (<5km), MEDIUM (5-10km), LONG (>10km)

  // Fetch Routes
  const { data: routes, isLoading: isRoutesLoading } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data,
  });

  // Fetch Stations
  const { data: stations, isLoading: isStationsLoading } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });

  const selectedRoute = useMemo(() => {
    return routes?.find((r) => r.id === selectedRouteId) || null;
  }, [routes, selectedRouteId]);

  // Filter routes
  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter((route) => {
      // Visibility Filter
      if (route.visibility === false) return false;

      // Search term
      const matchesSearch = 
        route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (route.description && route.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Difficulty
      const matchesDifficulty = 
        difficultyFilter === 'ALL' || route.difficulty === difficultyFilter;

      // Distance
      let matchesDistance = true;
      if (distanceFilter === 'SHORT') matchesDistance = route.distanceKm < 5;
      else if (distanceFilter === 'MEDIUM') matchesDistance = route.distanceKm >= 5 && route.distanceKm <= 10;
      else if (distanceFilter === 'LONG') matchesDistance = route.distanceKm > 10;

      return matchesSearch && matchesDifficulty && matchesDistance;
    });
  }, [routes, searchTerm, difficultyFilter, distanceFilter]);

  if (isRoutesLoading || isStationsLoading) {
    return <LoadingScreen message="Cargando experiencia turística..." />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-50/20">
      
      {/* Sidebar Panel - Glassmorphic details */}
      <div className="w-full lg:w-[450px] flex flex-col h-1/2 lg:h-full border-r border-gray-200/80 bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl z-20 flex-shrink-0">
        
        {/* Header Section */}
        <div className="p-6 pb-4 border-b border-gray-150">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center">
              <Compass size={18} className="animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Explora León</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Rutas y Puntos de Interés</p>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-450" size={16} />
            <input 
              type="text" 
              placeholder="Buscar rutas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100/50 border-none rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition text-xs font-semibold"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <Filter size={10} />
              <span>Dificultad</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['ALL', 'EASY', 'MODERATE', 'HARD'].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficultyFilter(level)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border tracking-wider transition-all cursor-pointer",
                    difficultyFilter === level 
                      ? "bg-black border-black text-white" 
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {level === 'ALL' ? 'Todos' : level === 'EASY' ? 'Fácil' : level === 'MODERATE' ? 'Moderada' : 'Difícil'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <Filter size={10} />
              <span>Distancia</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { key: 'ALL', label: 'Cualquiera' },
                { key: 'SHORT', label: '< 5 km' },
                { key: 'MEDIUM', label: '5 - 10 km' },
                { key: 'LONG', label: '> 10 km' },
              ].map((dist) => (
                <button
                  key={dist.key}
                  onClick={() => setDistanceFilter(dist.key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border tracking-wider transition-all cursor-pointer",
                    distanceFilter === dist.key 
                      ? "bg-black border-black text-white" 
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {dist.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable list of Routes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          
          {selectedRoute ? (
            // Back to list & details view of selected route
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedRouteId(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer"
              >
                ← Volver a todas las rutas
              </button>

              {/* Mini card of selected route */}
              <div className="bg-white dark:bg-gray-800 border rounded-3xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                <div className="space-y-1.5">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border",
                    selectedRoute.difficulty === 'EASY' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                    selectedRoute.difficulty === 'MODERATE' && "bg-amber-50 text-amber-700 border-amber-100",
                    selectedRoute.difficulty === 'HARD' && "bg-rose-50 text-rose-700 border-rose-100"
                  )}>
                    {selectedRoute.difficulty}
                  </span>
                  <h3 className="font-extrabold text-lg text-gray-900 leading-tight">{selectedRoute.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{selectedRoute.description}</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs font-semibold text-gray-700">
                  <div className="flex items-center gap-1">
                    <RouteIcon size={14} className="text-gray-400" />
                    <span>{selectedRoute.distanceKm} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-gray-400" />
                    <span>{selectedRoute.durationMin} mins</span>
                  </div>
                </div>
              </div>

              {/* POIs List of the Route */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Puntos de Interés ({selectedRoute.pois?.length || 0})</h4>
                <div className="space-y-2">
                  {selectedRoute.pois && selectedRoute.pois.length > 0 ? (
                    selectedRoute.pois.map((poi, idx) => (
                      <div 
                        key={poi.id}
                        onClick={() => setSelectedPoi(poi)}
                        className="p-3 bg-white hover:bg-gray-50 border rounded-2xl flex items-center justify-between cursor-pointer transition shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-gray-900">{poi.name}</p>
                            <p className="text-[9px] text-gray-400 uppercase font-black tracking-wider">{poi.category || 'POI'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600">Ver Detalles</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">Esta ruta no tiene puntos de interés.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Full list of routes
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-wider">
                <span>Rutas encontradas</span>
                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">{filteredRoutes.length}</span>
              </div>
              
              <div className="space-y-3">
                {filteredRoutes.map((route) => {
                  const thumbnailSrc = buildImageUrl(route.thumbnail) || 'https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?auto=format&fit=crop&w=400&q=80';
                  
                  return (
                    <div 
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      className="group bg-white hover:bg-gray-50 border rounded-[2rem] p-4 flex gap-4 cursor-pointer transition duration-300 shadow-sm hover:shadow-md"
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border relative">
                        <img 
                          src={thumbnailSrc} 
                          alt={route.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      
                      <div className="flex flex-col justify-between flex-grow min-w-0">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border leading-none",
                              route.difficulty === 'EASY' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                              route.difficulty === 'MODERATE' && "bg-amber-50 text-amber-700 border-amber-100",
                              route.difficulty === 'HARD' && "bg-rose-50 text-rose-700 border-rose-100"
                            )}>
                              {route.difficulty === 'EASY' ? 'Fácil' : route.difficulty === 'MODERATE' ? 'Media' : 'Difícil'}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm text-gray-900 leading-snug truncate">{route.name}</h3>
                          <p className="text-[11px] text-gray-400 line-clamp-1">{route.description}</p>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 pt-1 border-t border-gray-50">
                          <span className="flex items-center gap-1"><RouteIcon size={12}/> {route.distanceKm} km</span>
                          <span className="flex items-center gap-1"><Clock size={12}/> {route.durationMin} min</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredRoutes.length === 0 && (
                  <div className="py-12 text-center text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-150">
                    No se encontraron rutas con los filtros seleccionados.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Map Panel Area */}
      <div className="flex-1 h-1/2 lg:h-full relative overflow-hidden">
        <ExploreMap 
          stations={stations || []}
          selectedRoute={selectedRoute}
          selectedPoi={selectedPoi}
          onSelectPoi={setSelectedPoi}
        />
      </div>

      {/* Interactive POI Details Modal */}
      <AnimatePresence>
        {selectedPoi && (
          <POIDetailsModal 
            poi={selectedPoi} 
            onClose={() => setSelectedPoi(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
