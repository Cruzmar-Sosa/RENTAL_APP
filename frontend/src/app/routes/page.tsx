'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { MapPin, Route as RouteIcon, Clock, Move, Search, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AccessDenied } from '@/components/ui/access-denied';
import { Route } from '@/types';
import { useState, useMemo, useEffect, useRef } from 'react';
import { exportToExcel, exportToPDF } from '@/lib/export-utils';
import { cn } from '@/lib/utils';

export default function RoutesPage() {
  const { canView, isLoaded } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data,
    enabled: isLoaded
  });

  const filtered = useMemo(() => {
    if (!routes) return [];
    if (!debouncedSearch) return routes;
    const term = debouncedSearch.toLowerCase();
    return routes.filter((r: Route) => r.name.toLowerCase().includes(term) || r.description?.toLowerCase().includes(term) || r.difficulty.toLowerCase().includes(term));
  }, [routes, debouncedSearch]);

  const exportCols = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Difficulty', accessorKey: 'difficulty' },
    { header: 'Distance (km)', accessorKey: 'distanceKm' },
    { header: 'Duration (min)', accessorKey: 'durationMin' },
    { header: 'Description', accessorKey: 'description' },
  ];

  if (!isLoaded) return <LoadingScreen message="Loading Routes..." />;
  if (!canView('ROUTES') && !canView('BIKES')) return <AccessDenied />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Available Routes</h1>
          <p className="text-gray-500 mt-1">Discover pre-defined routes constructed for tourism.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search routes by name, difficulty..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition text-sm" />
        </div>
        <div className="hidden md:block h-8 w-px bg-gray-100" />
        <div className="flex items-center gap-2 px-2 shrink-0">
          <span className="text-sm font-medium text-gray-500">Total:</span>
          <span className="text-sm font-bold bg-black text-white px-2.5 py-1 rounded-lg">{filtered.length}</span>
        </div>
        <div className="hidden md:block h-8 w-px bg-gray-100" />
        <div ref={exportRef} className="relative">
          <button onClick={() => setExportOpen(!exportOpen)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border", exportOpen ? "bg-black text-white border-black shadow-lg shadow-black/10" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
            <Download size={16} />Export
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl shadow-black/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <button onClick={() => { exportToExcel(filtered, exportCols, 'routes'); setExportOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"><FileSpreadsheet size={16} className="text-green-600" />Excel (.xlsx)</button>
              <div className="border-t border-gray-50" />
              <button onClick={() => { exportToPDF(filtered, exportCols, 'Available Routes', 'routes'); setExportOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"><FileText size={16} className="text-red-500" />PDF Report</button>
            </div>
          )}
        </div>
      </div>

      {/* Card Grid — preserved original layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse border" />))
        ) : filtered.map((route: Route) => (
          <div key={route.id} className="bg-white border p-6 rounded-3xl flex flex-col gap-4 hover:shadow-xl hover:shadow-black/5 transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{route.name}</h3>
                <p className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-1 uppercase tracking-wider"><RouteIcon size={14}/> {route.difficulty}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-2xl text-black"><Move size={20}/></div>
            </div>
            {route.description && <p className="text-sm text-gray-500">{route.description}</p>}
            <div className="mt-auto pt-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium"><MapPin size={16} className="text-gray-400"/> {route.distanceKm} km</div>
              <div className="flex items-center gap-2 text-sm font-medium"><Clock size={16} className="text-gray-400"/> {route.durationMin} min</div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="bg-gray-50 rounded-3xl p-12 text-center text-gray-400 border border-dashed border-gray-200">
          {debouncedSearch ? 'No routes match your search.' : 'No predefined routes found in the database.'}
        </div>
      )}
    </div>
  );
}
