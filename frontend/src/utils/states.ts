import { Clock, CheckCircle, ShieldCheck, Play, DollarSign, Ban, XCircle, LucideIcon } from 'lucide-react';

export type ReservationStateConfig = {
  backend: string;
  label: string;
  color: string;
  icon: LucideIcon;
};

export const RESERVATION_STATES: Record<string, ReservationStateConfig> = {
  PENDING: { 
    backend: 'PENDING', 
    label: 'Awaiting Arrival', 
    color: 'bg-gray-100 text-gray-500 border-gray-200', 
    icon: Clock 
  },
  CONFIRMED: { 
    backend: 'CONFIRMED', 
    label: 'Ready to Unlock', 
    color: 'bg-blue-100 text-blue-600 border-blue-200', 
    icon: CheckCircle 
  },
  CHECKED_IN: { 
    backend: 'CHECKED_IN', 
    label: 'Unlocking...', 
    color: 'bg-indigo-100 text-indigo-600 border-indigo-200', 
    icon: ShieldCheck 
  },
  ACTIVE: { 
    backend: 'ACTIVE', 
    label: 'Ride in Progress', 
    color: 'bg-emerald-100 text-emerald-600 border-emerald-300', 
    icon: Play 
  },
  COMPLETED: { 
    backend: 'COMPLETED', 
    label: 'Return Pending', 
    color: 'bg-gray-100 text-gray-700 border-gray-200', 
    icon: CheckCircle 
  },
  SETTLEMENT_PENDING: { 
    backend: 'SETTLEMENT_PENDING', 
    label: 'Pending Settlement', 
    color: 'bg-orange-100 text-orange-600 border-orange-200', 
    icon: DollarSign 
  },
  SETTLED: { 
    backend: 'SETTLED', 
    label: 'Completed', 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    icon: CheckCircle 
  },
  CANCELLED: { 
    backend: 'CANCELLED', 
    label: 'Cancelled', 
    color: 'bg-red-50 text-red-600 border-red-200', 
    icon: Ban 
  },
  NO_SHOW: { 
    backend: 'NO_SHOW', 
    label: 'No Show', 
    color: 'bg-amber-100 text-amber-700 border-amber-200', 
    icon: XCircle 
  },
};

export function getPresentationState(status: string): ReservationStateConfig {
  return RESERVATION_STATES[status] || { 
    backend: status, 
    label: status, 
    color: 'bg-gray-50 text-gray-400 border-gray-100', 
    icon: Clock 
  };
}
