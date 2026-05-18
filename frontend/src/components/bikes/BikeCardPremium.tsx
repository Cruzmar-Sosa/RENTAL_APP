'use client';

import React from 'react';
import Image from 'next/image';
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ChevronRight,
  Info,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBikeImageUrl } from '@/lib/storageUtils';

interface BikeCardPremiumProps {
  bike: any;
  onReserve?: (bike: any) => void;
  onDetails?: (bike: any) => void;
  className?: string;
  isActionable?: boolean;
}

export function BikeCardPremium({
  bike,
  onReserve,
  onDetails,
  className,
  isActionable = true,
}: BikeCardPremiumProps) {
  const imageUrl = getBikeImageUrl(bike);
  const isAvailable =
    bike.operationalStatus === 'AVAILABLE' && bike.technicalStatus === 'OK';
  const isMaintenance =
    bike.technicalStatus === 'MAINTENANCE' ||
    bike.technicalStatus === 'OUT_OF_SERVICE';

  const getStatusConfig = () => {
    if (isMaintenance) {
      return {
        label: bike.technicalStatus ?? bike.operationalStatus,
        icon: <Wrench size={12} />,
        className: 'bg-red-500/10 text-red-600 border-red-200',
      };
    }
    if (bike.operationalStatus === 'IN_USE') {
      return {
        label: 'IN USE',
        icon: <AlertCircle size={12} />,
        className: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
      };
    }
    if (bike.operationalStatus === 'RESERVED') {
      return {
        label: 'RESERVED',
        icon: <CheckCircle2 size={12} />,
        className: 'bg-amber-500/10 text-amber-600 border-amber-200',
      };
    }
    return {
      label: 'AVAILABLE',
      icon: <CheckCircle2 size={12} />,
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    };
  };

  const status = getStatusConfig();
  const batteryLevel = bike.batteryLevel ?? 100;
  const batteryColor =
    batteryLevel > 50
      ? 'bg-emerald-500'
      : batteryLevel > 20
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div
      className={cn(
        'group relative bg-white rounded-[28px] overflow-hidden border border-gray-100',
        'transition-all duration-500 hover:shadow-[0_24px_48px_-8px_rgba(0,0,0,0.10)] hover:-translate-y-0.5',
        isMaintenance && 'opacity-75 grayscale-[0.4]',
        className,
      )}
    >
      {/* ── Image Section ── */}
      <div className="relative aspect-4/3 overflow-hidden bg-gray-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={bike.model ?? `Bike #${bike.code}`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-50">
            <Image
              src="/bike_placeholder.png"
              alt="Bike placeholder"
              width={160}
              height={160}
              className="w-3/5 h-3/5 object-contain opacity-15 grayscale"
            />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <div
            className={cn(
              'backdrop-blur-md border px-2.5 py-1 rounded-full',
              'flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase',
              status.className,
            )}
          >
            {status.icon}
            {status.label}
          </div>
        </div>

        {/* Battery Badge */}
        <div className="absolute top-3 right-3 backdrop-blur-md bg-white/80 border border-white/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <Zap size={11} className={cn('fill-current', batteryLevel > 20 ? 'text-amber-500' : 'text-red-500')} />
          <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', batteryColor)}
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
          <span className="text-[10px] font-black text-gray-800">{batteryLevel}%</span>
        </div>

        {/* Maintenance Overlay */}
        {isMaintenance && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white/95 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2">
              <Wrench size={16} className="text-red-500" />
              <span className="text-xs font-black uppercase tracking-tight text-gray-900">
                Under Maintenance
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Content Section ── */}
      <div className="p-5 space-y-4">
        {/* Title + Price */}
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="text-lg font-black text-gray-900 leading-tight">
              {bike.model ?? 'eTours Premium'}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              Unit #{bike.code}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-base font-black text-black">$20</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase block leading-tight">
              /hr
            </span>
          </div>
        </div>

        {/* Station */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
          <MapPin size={13} className="text-gray-400 shrink-0" />
          <span className="text-xs font-bold text-gray-600 truncate">
            {bike.station?.name ?? 'Assigned to Depot'}
          </span>
        </div>

        {/* Actions */}
        {isActionable && (
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              title="View details"
              onClick={() => onDetails?.(bike)}
              className="p-3.5 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 hover:text-black transition-all"
            >
              <Info size={18} />
            </button>
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => onReserve?.(bike)}
              className={cn(
                'flex-1 p-3.5 rounded-xl font-black text-xs uppercase tracking-widest',
                'flex items-center justify-center gap-2 transition-all',
                isAvailable
                  ? 'bg-black text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/15'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none',
              )}
            >
              Reserve Now
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
