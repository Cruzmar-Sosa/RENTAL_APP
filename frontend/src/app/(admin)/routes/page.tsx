'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { 
  MapPin, 
  Route as RouteIcon, 
  Clock, 
  Move, 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText,
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Music,
  FolderOpen,
  Check,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { BaseModal } from '@/components/ui/BaseModal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Route, POI } from '@/types';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { safeParsePolyline, Coordinate, calculateDistanceKm, estimateDurationMin } from '@/utils/geo';
import dynamic from 'next/dynamic';
import { fmtRoute } from '@/lib/businessCode';

// Dynamic import — no SSR for Leaflet
const RouteBuilderMap = dynamic(() => import('@/components/RouteBuilderMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">
      <span className="text-gray-400 text-sm font-medium">Cargando editor de mapa...</span>
    </div>
  ),
});

// Stable empty array to prevent new reference on every render
const EMPTY_POIS: POI[] = [];

export default function RoutesPage() {
  const { canView, canCreate, canUpdate, canDelete, isLoaded } = usePermissions();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [confirmDeleteRoute, setConfirmDeleteRoute] = useState<Route | null>(null);

  // Route Form State
  const [routeForm, setRouteForm] = useState({
    name: '',
    description: '',
    difficulty: 'EASY' as 'EASY' | 'MODERATE' | 'HARD',
    distanceKm: '0',
    durationMin: '0',
    thumbnail: '',
    visibility: true
  });

  // Map coordinates state (replaces polyline textarea)
  const [visualPolyline, setVisualPolyline] = useState<Coordinate[]>([]);
  const [navigationPolyline, setNavigationPolyline] = useState<Coordinate[]>([]);

  // POI Manager States (Inline inside Route Edit Form)
  const [poiFormOpen, setPoiFormOpen] = useState(false);
  const [editingPoi, setEditingPoi] = useState<POI | null>(null);
  const [poiForm, setPoiForm] = useState({
    name: '',
    category: '',
    description: '',
    latitude: '',
    longitude: '',
    audioGuideUrl: '',
    gallery: '[]',
    order: '-1'
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch Routes
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data,
    enabled: isLoaded
  });

  // Filter routes
  const filtered = useMemo(() => {
    if (!routes) return [];
    if (!debouncedSearch) return routes;
    const term = debouncedSearch.toLowerCase();
    return routes.filter((r: Route) => 
      r.name.toLowerCase().includes(term) || 
      r.description?.toLowerCase().includes(term) || 
      r.difficulty.toLowerCase().includes(term)
    );
  }, [routes, debouncedSearch]);

  // Route Mutation
  const saveRouteMutation = useMutation({
    mutationFn: async (data: typeof routeForm) => {
      const payload = {
        ...data,
        distanceKm: parseFloat(data.distanceKm) || 0,
        durationMin: parseInt(data.durationMin) || 0,
        visualPolyline,
        navigationPolyline,
      };

      if (editingRoute) {
        return api.put(`/routes/${editingRoute.id}`, payload);
      }
      return api.post('/routes', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success(`Ruta ${editingRoute ? 'actualizada' : 'creada'} exitosamente`);
      closeRouteModal();
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.message || 'Error al guardar la ruta');
    }
  });

  // Delete Route Mutation
  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Ruta eliminada con éxito');
      setConfirmDeleteRoute(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'No se pudo eliminar la ruta');
      setConfirmDeleteRoute(null);
    }
  });

  // POI Save Mutation
  const savePoiMutation = useMutation({
    mutationFn: async (data: typeof poiForm) => {
      if (!editingRoute) return;

      let galleryParsed = null;
      try {
        galleryParsed = JSON.parse(data.gallery);
      } catch (e) {
        throw new Error('Formato de galería inválido. Debe ser un array JSON de strings.');
      }

      const payload = {
        name: data.name,
        category: data.category,
        description: data.description,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        audioGuideUrl: data.audioGuideUrl || undefined,
        gallery: galleryParsed,
        order: parseInt(data.order || '0')
      };

      if (editingPoi) {
        return api.put(`/routes/${editingRoute.id}/pois/${editingPoi.id}`, payload);
      }
      return api.post(`/routes/${editingRoute.id}/pois`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success(`Punto de Interés ${editingPoi ? 'actualizado' : 'creado'} exitosamente`);
      resetPoiForm();
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.message || 'Error al guardar el Punto de Interés');
    }
  });

  // POI Delete Mutation
  const deletePoiMutation = useMutation({
    mutationFn: async (poiId: string) => {
      if (!editingRoute) return;
      await api.delete(`/routes/${editingRoute.id}/pois/${poiId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Punto de Interés eliminado');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'No se pudo eliminar el Punto de Interés');
    }
  });

  // POI Reorder Mutation
  const reorderPoisMutation = useMutation({
    mutationFn: async (orders: { id: string; order: number }[]) => {
      if (!editingRoute) return;
      return api.put(`/routes/${editingRoute.id}/pois/reorder`, { orders });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Orden de Puntos de Interés actualizado');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al reordenar Puntos de Interés');
    }
  });

  // Route Form Helpers
  const openCreateRoute = () => {
    setEditingRoute(null);
    setRouteForm({
      name: '',
      description: '',
      difficulty: 'EASY',
      distanceKm: '0',
      durationMin: '0',
      thumbnail: '',
      visibility: true
    });
    setVisualPolyline([]);
    setNavigationPolyline([]);
    setIsRouteModalOpen(true);
  };

  const openEditRoute = (route: Route) => {
    setEditingRoute(route);
    setRouteForm({
      name: route.name,
      description: route.description || '',
      difficulty: route.difficulty,
      distanceKm: route.distanceKm.toString(),
      durationMin: route.durationMin.toString(),
      thumbnail: route.thumbnail || '',
      visibility: route.visibility
    });
    setVisualPolyline(safeParsePolyline(route.visualPolyline));
    setNavigationPolyline(safeParsePolyline(route.navigationPolyline));
    setIsRouteModalOpen(true);
  };

  const closeRouteModal = () => {
    setIsRouteModalOpen(false);
    setEditingRoute(null);
    setVisualPolyline([]);
    setNavigationPolyline([]);
    resetPoiForm();
  };

  // ── Derived distance from navigationPolyline (no circular updates) ──
  useEffect(() => {
    const dist = calculateDistanceKm(navigationPolyline);
    const rounded = Math.round(dist * 100) / 100;
    setRouteForm((prev) => {
      const current = parseFloat(prev.distanceKm) || 0;
      if (Math.abs(current - rounded) < 0.001) return prev; // No change
      return { ...prev, distanceKm: rounded.toString() };
    });
  }, [navigationPolyline]);

  // ── Derived duration from distanceKm (no circular updates) ──
  useEffect(() => {
    const dist = parseFloat(routeForm.distanceKm) || 0;
    const dur = estimateDurationMin(dist);
    setRouteForm((prev) => {
      const current = parseInt(prev.durationMin) || 0;
      if (current === dur) return prev; // No change
      return { ...prev, durationMin: dur.toString() };
    });
  }, [routeForm.distanceKm]);

  const handlePoiPlacedFromMap = useCallback((coord: Coordinate) => {
    setPoiForm((prev) => ({
      ...prev,
      latitude: coord.lat.toString(),
      longitude: coord.lng.toString(),
    }));
    setPoiFormOpen(true);
    toast.info('Coordenadas del POI capturadas desde el mapa');
  }, []);

  // Callback when POI is dragged on the map
  const handlePoiDrag = useCallback((poiId: string, latlng: any) => {
    if (!editingRoute) return;
    api.put(`/routes/${editingRoute.id}/pois/${poiId}`, {
      latitude: latlng.lat,
      longitude: latlng.lng
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Punto de Interés reubicado');
    }).catch(err => {
      toast.error('Error al mover el Punto de Interés');
    });
  }, [editingRoute, queryClient]);

  // Bulk reordering POI handler
  const handleMovePoi = (poiId: string, direction: 'up' | 'down') => {
    if (!activeRoute?.pois) return;

    // Get only sequenced POIs
    const sequenced = [...activeRoute.pois]
      .filter((p) => p.order >= 0)
      .sort((a, b) => a.order - b.order);

    const index = sequenced.findIndex((p) => p.id === poiId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sequenced.length) return;

    const targetPoi = sequenced[newIndex];
    const currentPoi = sequenced[index];

    const orders = sequenced.map((p, idx) => {
      if (idx === index) {
        return { id: p.id, order: targetPoi.order };
      }
      if (idx === newIndex) {
        return { id: p.id, order: currentPoi.order };
      }
      return { id: p.id, order: p.order };
    });

    // Re-normalize active orders to be strictly sequential (0, 1, 2...)
    orders.sort((a, b) => a.order - b.order);
    const normalizedOrders = orders.map((item, idx) => ({
      id: item.id,
      order: idx,
    }));

    // Keep unsequenced POIs at -1
    const unsequenced = activeRoute.pois
      .filter((p) => p.order < 0)
      .map((p) => ({ id: p.id, order: -1 }));

    reorderPoisMutation.mutate([...normalizedOrders, ...unsequenced]);
  };

  // POI Form Helpers
  const resetPoiForm = () => {
    setPoiFormOpen(false);
    setEditingPoi(null);
    setPoiForm({
      name: '',
      category: '',
      description: '',
      latitude: '',
      longitude: '',
      audioGuideUrl: '',
      gallery: '[]',
      order: '-1',
    });
  };

  const openEditPoi = (poi: POI) => {
    setEditingPoi(poi);
    setPoiForm({
      name: poi.name,
      category: poi.category || '',
      description: poi.description || '',
      latitude: poi.latitude.toString(),
      longitude: poi.longitude.toString(),
      audioGuideUrl: poi.audioGuideUrl || '',
      gallery: poi.gallery ? (typeof poi.gallery === 'string' ? poi.gallery : JSON.stringify(poi.gallery)) : '[]',
      order: poi.order.toString()
    });
    setPoiFormOpen(true);
  };

  const exportCols = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Difficulty', accessorKey: 'difficulty' },
    { header: 'Distance (km)', accessorKey: 'distanceKm' },
    { header: 'Duration (min)', accessorKey: 'durationMin' },
    { header: 'Description', accessorKey: 'description' },
  ];

  if (!isLoaded) return <LoadingScreen message="Loading Routes..." />;
  if (!canView('ROUTES') && !canView('BIKES')) return <AccessDenied />;

  // Find updated route from query data for POIs inline rendering
  const activeRoute = editingRoute ? routes?.find(r => r.id === editingRoute.id) : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routes Management</h1>
          <p className="text-gray-500 mt-1">Configure preset trails and local points of interest.</p>
        </div>
        {canCreate('ROUTES') && (
          <button 
            onClick={openCreateRoute}
            className="bg-black text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-850 transition shadow-lg shadow-black/5 cursor-pointer self-start md:self-auto"
          >
            <Plus size={20} />
            Add Route
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search routes by name, difficulty..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition text-sm font-semibold" 
          />
        </div>
        <div className="hidden md:block h-8 w-px bg-gray-100" />
        <div className="flex items-center gap-2 px-2 shrink-0">
          <span className="text-sm font-medium text-gray-500">Total:</span>
          <span className="text-sm font-bold bg-black text-white px-2.5 py-1 rounded-lg">{filtered.length}</span>
        </div>
        <div className="hidden md:block h-8 w-px bg-gray-100" />
        <div ref={exportRef} className="relative">
          <button onClick={() => setExportOpen(!exportOpen)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border cursor-pointer", exportOpen ? "bg-black text-white border-black shadow-lg shadow-black/10" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
            <Download size={16} />Export
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl shadow-black/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <button onClick={() => { exportToExcel(filtered as unknown as Record<string, unknown>[], exportCols, 'routes'); setExportOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"><FileSpreadsheet size={16} className="text-green-600" />Excel (.xlsx)</button>
              <div className="border-t border-gray-50" />
              <button onClick={() => { exportToPDF(filtered as unknown as Record<string, unknown>[], exportCols, 'Available Routes', 'routes'); setExportOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"><FileText size={16} className="text-red-500" />PDF Report</button>
            </div>
          )}
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse border" />))
        ) : filtered.map((route: Route) => (
          <div key={route.id} className="bg-white border p-6 rounded-3xl flex flex-col gap-4 hover:shadow-xl hover:shadow-black/5 transition relative group">
            
            {/* Visibility Indicator */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
              {route.visibility ? (
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg" title="Visible para usuarios"><Eye size={14} /></span>
              ) : (
                <span className="p-1.5 bg-gray-50 text-gray-400 rounded-lg" title="Oculto para usuarios"><EyeOff size={14} /></span>
              )}
            </div>

            <div className="flex justify-between items-start pr-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-lg">{fmtRoute((route as any).code)}</span>
                </div>
                <h3 className="font-extrabold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{route.name}</h3>
                <p className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-1 uppercase tracking-wider"><RouteIcon size={14}/> {route.difficulty}</p>
              </div>
            </div>
            {route.description && <p className="text-sm text-gray-500 line-clamp-2">{route.description}</p>}
            
            {/* POIs Count */}
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50 py-1.5 px-3 rounded-xl inline-block self-start">
              📌 {route.pois?.length || 0} Puntos de Interés
            </div>

            <div className="mt-auto pt-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700"><MapPin size={16} className="text-gray-400"/> {route.distanceKm} km</div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Clock size={16} className="text-gray-400"/> {route.durationMin} min</div>
            </div>

            {/* Admin Controls */}
            <div className="flex gap-2 mt-2 pt-2 border-t justify-end">
              {canUpdate('ROUTES') && (
                <button 
                  onClick={() => openEditRoute(route)}
                  className="p-2 bg-gray-50 text-gray-600 hover:bg-black hover:text-white rounded-xl transition cursor-pointer"
                  title="Editar Ruta y POIs"
                >
                  <Edit3 size={16} />
                </button>
              )}
              {canDelete('ROUTES') && (
                <button 
                  onClick={() => setConfirmDeleteRoute(route)}
                  className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition cursor-pointer"
                  title="Eliminar Ruta"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="bg-gray-50 rounded-3xl p-12 text-center text-gray-400 border border-dashed border-gray-200">
          {debouncedSearch ? 'No routes match your search.' : 'No predefined routes found in the database.'}
        </div>
      )}

      {/* Create / Edit Route Modal */}
      <BaseModal 
        isOpen={isRouteModalOpen} 
        onClose={closeRouteModal} 
        showFooter={false}
        className="max-w-4xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-h-[85vh] overflow-y-auto p-2 scrollbar-thin">
          
          {/* Left Column: Route Form */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900">{editingRoute ? 'Update Route' : 'Create Route'}</h2>
              <p className="text-gray-500 text-sm font-medium">Configure trail information and path.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveRouteMutation.mutate(routeForm); }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Route Name</label>
                <input 
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 font-semibold text-sm" 
                  placeholder="e.g. Centro Histórico Tour"
                  value={routeForm.name}
                  onChange={e => setRouteForm({...routeForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Description</label>
                <textarea 
                  rows={3}
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 text-sm" 
                  placeholder="Describa el recorrido..."
                  value={routeForm.description}
                  onChange={e => setRouteForm({...routeForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Difficulty</label>
                  <select 
                    className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 text-sm font-semibold"
                    value={routeForm.difficulty}
                    onChange={e => setRouteForm({...routeForm, difficulty: e.target.value as any})}
                  >
                    <option value="EASY">Fácil</option>
                    <option value="MODERATE">Media</option>
                    <option value="HARD">Difícil</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Visibility</label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <input 
                      type="checkbox" 
                      id="visibility"
                      checked={routeForm.visibility}
                      onChange={e => setRouteForm({...routeForm, visibility: e.target.checked})}
                      className="w-5 h-5 rounded-md border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                    <label htmlFor="visibility" className="text-xs font-bold text-gray-600 cursor-pointer">Visible</label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Distance (km) <span className="text-[9px] text-blue-500 normal-case">auto-calculated</span></label>
                  <input 
                    type="number" step="any" min="0"
                    className="w-full bg-gray-100 border-none p-4 rounded-2xl outline-none font-semibold text-sm text-gray-500 cursor-default" 
                    placeholder="Auto"
                    value={routeForm.distanceKm}
                    readOnly
                    tabIndex={-1}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Duration (mins) <span className="text-[9px] text-blue-500 normal-case">auto-calculated</span></label>
                  <input 
                    type="number" min="0"
                    className="w-full bg-gray-100 border-none p-4 rounded-2xl outline-none font-semibold text-sm text-gray-500 cursor-default" 
                    placeholder="Auto"
                    value={routeForm.durationMin}
                    readOnly
                    tabIndex={-1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Thumbnail Key (imageKey-first)</label>
                <input 
                  className="w-full bg-gray-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 text-xs font-mono" 
                  placeholder="e.g. routes/centro-historico.jpg"
                  value={routeForm.thumbnail}
                  onChange={e => setRouteForm({...routeForm, thumbnail: e.target.value})}
                />
              </div>

              {editingRoute && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400">Route Path (Interactive Map)</label>
                  <RouteBuilderMap
                    visualPolyline={visualPolyline}
                    navigationPolyline={navigationPolyline}
                    onVisualPolylineChange={setVisualPolyline}
                    onNavigationPolylineChange={setNavigationPolyline}
                    onPoiPlaced={handlePoiPlacedFromMap}
                    onPoiDrag={handlePoiDrag}
                    pois={activeRoute?.pois ?? EMPTY_POIS}
                    height="450px"
                  />
                </div>
              )}

              <button 
                type="submit"
                disabled={saveRouteMutation.isPending}
                className="w-full bg-black text-white p-4 rounded-2xl font-bold mt-4 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                {saveRouteMutation.isPending ? 'Syncing Route...' : 'Save Route Config'}
              </button>
            </form>
          </div>

          {/* Right Column: inline POI manager */}
          <div className="border-t lg:border-t-0 lg:border-l border-gray-150 pt-6 lg:pt-0 lg:pl-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Points of Interest (POIs)</h3>
              <p className="text-gray-500 text-sm font-medium">Manage localized stops along this route.</p>
            </div>

            {editingRoute ? (
              <div className="space-y-6">
                
                {/* Form to Create/Edit POI */}
                {poiFormOpen ? (
                  <div className="p-4 bg-gray-50 rounded-3xl border border-gray-200/50 space-y-4">
                    <h4 className="text-sm font-black text-gray-900">{editingPoi ? 'Editar POI' : 'Nuevo POI'}</h4>
                    
                    <div className="space-y-3">
                      <input 
                        placeholder="Nombre del POI"
                        value={poiForm.name}
                        onChange={e => setPoiForm({...poiForm, name: e.target.value})}
                        className="w-full bg-white p-3 rounded-xl border border-gray-200 text-xs font-semibold"
                        required
                      />
                      <input 
                        placeholder="Categoría (e.g. Histórico, Parque, Restaurante)"
                        value={poiForm.category}
                        onChange={e => setPoiForm({...poiForm, category: e.target.value})}
                        className="w-full bg-white p-3 rounded-xl border border-gray-200 text-xs font-semibold"
                      />
                      <textarea 
                        placeholder="Descripción corta..."
                        value={poiForm.description}
                        onChange={e => setPoiForm({...poiForm, description: e.target.value})}
                        className="w-full bg-white p-3 rounded-xl border border-gray-200 text-xs"
                        rows={2}
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="number" step="any" placeholder="Latitud"
                          value={poiForm.latitude}
                          onChange={e => setPoiForm({...poiForm, latitude: e.target.value})}
                          className="bg-white p-3 rounded-xl border border-gray-200 text-xs font-mono"
                          required
                        />
                        <input 
                          type="number" step="any" placeholder="Longitud"
                          value={poiForm.longitude}
                          onChange={e => setPoiForm({...poiForm, longitude: e.target.value})}
                          className="bg-white p-3 rounded-xl border border-gray-200 text-xs font-mono"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <input 
                          type="number" min="0" placeholder="Orden"
                          value={poiForm.order}
                          onChange={e => setPoiForm({...poiForm, order: e.target.value})}
                          className="bg-white p-3 rounded-xl border border-gray-200 text-xs font-semibold col-span-1"
                          required
                        />
                        <input 
                          placeholder="Audio Guide URL (mp3/ogg)"
                          value={poiForm.audioGuideUrl}
                          onChange={e => setPoiForm({...poiForm, audioGuideUrl: e.target.value})}
                          className="w-full bg-white p-3 rounded-xl border border-gray-200 text-xs col-span-2"
                        />
                      </div>

                      <input 
                        placeholder='Gallery Keys JSON (e.g. ["poi/foto1.jpg"])'
                        value={poiForm.gallery}
                        onChange={e => setPoiForm({...poiForm, gallery: e.target.value})}
                        className="w-full bg-white p-3 rounded-xl border border-gray-200 text-xs font-mono"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button 
                        type="button" 
                        onClick={resetPoiForm}
                        className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button" 
                        onClick={() => savePoiMutation.mutate(poiForm)}
                        disabled={savePoiMutation.isPending}
                        className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Check size={14} /> Guardar POI
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setPoiFormOpen(true)}
                    className="w-full py-3 bg-gray-50 border border-dashed border-gray-250 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100/50 hover:border-gray-300 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={16} /> Agregar Punto de Interés
                  </button>
                )}

                {/* POIs List */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">POI List</h4>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {activeRoute?.pois && activeRoute.pois.length > 0 ? (() => {
                      const sequencedCount = activeRoute.pois.filter((p) => p.order >= 0).length;
                      const sortedPois = [...activeRoute.pois].sort((a, b) => {
                        if (a.order >= 0 && b.order < 0) return -1;
                        if (a.order < 0 && b.order >= 0) return 1;
                        return a.order - b.order;
                      });

                      return sortedPois.map((poi: POI, idx: number) => (
                        <div 
                          key={poi.id}
                          className="p-4 bg-white border border-gray-150 rounded-2xl flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-sm text-gray-900 truncate">
                              <span className="text-xs font-bold text-gray-400 mr-1.5">
                                {poi.order >= 0 ? `#${poi.order + 1}` : '📍'}
                              </span>
                              {poi.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{poi.category || 'POI'}</span>
                              <span className="text-[9px] font-mono text-gray-400">({poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)})</span>
                              {poi.audioGuideUrl && <Music size={12} className="text-gray-400" />}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {poi.order >= 0 && (
                              <>
                                <button
                                  type="button"
                                  disabled={idx === 0 || reorderPoisMutation.isPending}
                                  onClick={() => handleMovePoi(poi.id, 'up')}
                                  className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition cursor-pointer"
                                  title="Subir"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === sequencedCount - 1 || reorderPoisMutation.isPending}
                                  onClick={() => handleMovePoi(poi.id, 'down')}
                                  className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition cursor-pointer"
                                  title="Bajar"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => openEditPoi(poi)}
                              className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition cursor-pointer"
                              title="Editar POI"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={() => deletePoiMutation.mutate(poi.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Eliminar POI"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ));
                    })() : (
                      <p className="text-xs text-gray-400 italic text-center py-6">No POIs configured for this route yet.</p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed rounded-3xl text-center text-gray-400">
                <FolderOpen size={40} className="mb-2 text-gray-300" />
                <p className="text-xs font-bold">Manage POIs here after saving the route configuration first.</p>
              </div>
            )}
          </div>

        </div>
      </BaseModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteRoute}
        onClose={() => setConfirmDeleteRoute(null)}
        onConfirm={() => confirmDeleteRoute && deleteRouteMutation.mutate(confirmDeleteRoute.id)}
        title="Remove Route"
        message={`Are you sure you want to permanently delete route ${confirmDeleteRoute?.name}? This will also delete all associated points of interest.`}
        confirmText="Remove Route"
        isLoading={deleteRouteMutation.isPending}
      />
    </div>
  );
}
