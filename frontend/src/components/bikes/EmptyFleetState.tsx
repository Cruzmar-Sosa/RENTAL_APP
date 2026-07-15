'use client';

import React from 'react';
import { Bike } from 'lucide-react';

interface EmptyFleetStateProps {
  stationName: string;
  className?: string;
}

/**
 * Empty state displayed when a station has zero available bikes.
 * Compact, accessible, and smoothly transitions in/out.
 */
export function EmptyFleetState({ stationName, className }: EmptyFleetStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        py-8 px-6
        animate-in fade-in slide-in-from-bottom-2 duration-500
        ${className ?? ''}
      `}
      role="status"
      aria-label={`No bikes available at ${stationName}`}
    >
      {/* Icon container */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Bike size={28} className="text-gray-300" strokeWidth={1.5} />
        </div>
        {/* Subtle pulse ring */}
        <div className="absolute inset-0 rounded-2xl bg-gray-200/50 animate-ping animation-duration:3s" />
      </div>

      {/* Primary message */}
      <p className="text-sm font-bold text-gray-500 leading-tight">
        No bikes currently available
      </p>

      {/* Secondary message */}
      <p className="text-xs text-gray-400 mt-1.5 max-w-[220px] leading-relaxed">
        Check nearby stations or come back later
      </p>

      {/* Subtle indicator dots */}
      <div className="flex items-center gap-1.5 mt-4">
        <span className="w-1 h-1 rounded-full bg-gray-200" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        <span className="w-1 h-1 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
