'use client';

import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SidebarSkeleton() {
  return (
    <aside className="relative flex flex-col bg-white border-r transition-all duration-300 ease-in-out z-40 w-64">
      <div className="flex items-center justify-between p-6 h-20">
        <span className="text-xl font-bold tracking-tight text-gray-200 bg-gray-100 rounded-md w-32 h-6 animate-pulse" />
        <button disabled className="p-2 rounded-lg text-gray-300">
          <ChevronLeft size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-3 py-3 rounded-xl animate-pulse">
            <div className="h-6 w-6 rounded-md bg-gray-100" />
            <div className="h-4 w-24 rounded-md bg-gray-50" />
          </div>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-4 w-full px-3 py-3 rounded-xl animate-pulse">
            <div className="h-6 w-6 rounded-md bg-red-50" />
            <div className="h-4 w-16 rounded-md bg-red-50" />
        </div>
      </div>
    </aside>
  );
}
