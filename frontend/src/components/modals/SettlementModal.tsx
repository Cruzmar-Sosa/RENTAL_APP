"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, Calculator, AlertCircle, Timer, History, DollarSign, ShieldCheck, Zap, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Reservation } from '@/types';
import { cn } from '@/lib/utils';
import { formatNIDate, formatNIDateOnly, formatNITimeOnly } from '@/lib/dateUtils';
import { safeCurrency, formatCurrency } from '@/lib/financial';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onConfirm?: (id: string, action: string, data?: any) => Promise<void>;
  mode?: 'admin' | 'user';
}

export function SettlementModal({ isOpen, onClose, reservation, onConfirm, mode = 'admin' }: SettlementModalProps) {
  const [loading, setLoading] = useState(false);
  const [incidentType, setIncidentType] = useState(reservation?.incidentType || 'NONE');
  const [incidentCategory, setIncidentCategory] = useState(reservation?.incidentCategory || 'CUSTOMER_FAULT');
  const [incidentNotes, setIncidentNotes] = useState(reservation?.incidentNotes || '');

  const [now, setNow] = useState(new Date());
  const [isManualOverride, setIsManualOverride] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000); // Update every 30s for responsiveness
    return () => clearInterval(interval);
  }, []);

  // Duration calculation (Single Source of Truth)
  const autoDuration = useMemo(() => {
    if (!reservation) return { days: 0, hours: 0, total: 0 };
    const actualStart = new Date(reservation.actualStart || reservation.startTime);
    // If it's already completed, use actualEnd
    const endRef = reservation.actualEnd ? new Date(reservation.actualEnd) : now;
    const diffMs = endRef.getTime() - actualStart.getTime();
    const totalHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    return {
      days: Math.floor(totalHours / 24),
      hours: totalHours % 24,
      total: totalHours
    };
  }, [reservation, now]);

  const [actualDays, setActualDays] = useState(autoDuration.days);
  const [actualHours, setActualHours] = useState(autoDuration.hours);

  // Sync autoDuration with state if no manual override
  useEffect(() => {
    if (!isManualOverride && isOpen) {
      setActualDays(autoDuration.days);
      setActualHours(autoDuration.hours);
    }
  }, [autoDuration, isManualOverride, isOpen]);

  const isSubmitting = useRef(false);

  if (!reservation) return null;

  const rate = safeCurrency(reservation.ratePerHour || 50);
  
  // Estimated Duration (Math.ceil as per requirement)
  const estDuration = Math.ceil(
    (new Date(reservation.endTime || '').getTime() - new Date(reservation.startTime).getTime()) / 3600000
  );
  
  const realDuration = (actualDays * 24) + actualHours;
  const diffDuration = realDuration - estDuration;

  // For User Mode, we do not compute new real cost if it's already completed
  const realCost = reservation.priceActual !== null && reservation.priceActual !== undefined 
    ? safeCurrency(reservation.priceActual) 
    : (realDuration * rate) + safeCurrency(reservation.extrasTotal || 0);

  const isCompanyFault = incidentType !== 'NONE' && incidentCategory === 'COMPANY_FAULT';
  // If admin overrides to company fault, cost is 0. If user mode, they can't override.
  const effectiveRealCost = (mode === 'admin' && isCompanyFault) ? 0 : realCost;
  
  const amountPaid = reservation.payments
    ?.filter(p => p.status === 'PAID')
    .reduce((acc, p) => acc + (p.type === 'REFUND' ? -safeCurrency(p.amount) : safeCurrency(p.amount)), 0) || 0;
  
  const balance = effectiveRealCost - amountPaid;

  const handleAction = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    try {
      if (mode === 'admin') {
        if (reservation.status === 'ACTIVE') {
          // Operational Completion
          const actualStart = new Date(reservation.actualStart || reservation.startTime);
          const actualEnd = isManualOverride 
            ? new Date(actualStart.getTime() + (realDuration * 60 * 60 * 1000))
            : now;

          await onConfirm?.(reservation.id, 'complete', {
            priceActual: effectiveRealCost,
            actualEnd: actualEnd.toISOString(),
            incidentType: incidentType !== 'NONE' ? incidentType : null,
            incidentCategory: incidentType !== 'NONE' ? incidentCategory : null,
            incidentNotes: incidentType !== 'NONE' ? incidentNotes : null,
          });
        } else if (reservation.status === 'SETTLEMENT_PENDING' || reservation.status === 'COMPLETED') {
          // Financial Settlement
          await onConfirm?.(reservation.id, 'settle', {
            settlementReference: `SETTLE-UI-${Date.now()}`
          });
        }
      } else {
        // User Mode: Submitting an incident report
        if (incidentType !== 'NONE') {
          await onConfirm?.(reservation.id, 'report-incident', {
            incidentType,
            incidentNotes
          });
        }
      }
      onClose();
    } catch (error) {
      console.error('[SettlementModal] Error during action:', error);
      isSubmitting.current = false;
    } finally {
      setLoading(false);
    }
  };

  const clientName = reservation.guestName || reservation.clientName || reservation.user?.name || 'Unknown';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      showFooter={false}
      className="max-w-6xl"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
          {mode === 'admin' ? <CheckCircle2 size={24} /> : <Info size={24} />}
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">
            {mode === 'admin' ? 'Ride Settlement' : 'Ride Details & Timeline'}
          </h2>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-widest text-[10px]">
            {mode === 'admin' ? 'Review & Finalize Financials' : 'View usage and report incidents'}
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Top Stats: Duration Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Estimated', value: `${estDuration}h`, icon: Clock, color: 'text-gray-400' },
            { label: 'Actual Usage', value: `${realDuration}h`, icon: Timer, color: 'text-emerald-600' },
            { 
              label: 'Difference', 
              value: diffDuration > 0 ? `+${diffDuration}h` : `${diffDuration}h`, 
              icon: History, 
              color: diffDuration > 0 ? 'text-orange-500' : 'text-blue-500' 
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 flex items-center gap-4 shadow-sm group hover:border-black transition-all">
              <div className={cn("p-3 rounded-xl bg-gray-50 transition-colors group-hover:bg-black group-hover:text-white", stat.color)}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Check-in Visual Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50/50 border-2 border-emerald-100 p-6 rounded-[2rem] flex items-center gap-6 shadow-sm">
            <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">🕒 Check-in (Ride Start)</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-black text-gray-900">
                  {formatNIDateOnly(reservation.actualStart || reservation.startTime)}
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                <p className="text-xl font-black text-emerald-600">
                  {formatNITimeOnly(reservation.actualStart || reservation.startTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 border-2 border-blue-100 p-6 rounded-[2rem] flex items-center gap-6 shadow-sm">
            <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">🕒 {reservation.actualEnd ? 'Check-out' : 'Current Snapshot'}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-black text-gray-900">
                  {formatNIDateOnly(reservation.actualEnd || now)}
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                <p className="text-xl font-black text-blue-600">
                  {formatNITimeOnly(reservation.actualEnd || now)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Financial Card */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <DollarSign size={20} className="text-emerald-600" />
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Financial Summary</h3>
            </div>

            <div className="bg-black text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calculator size={140} />
              </div>
              
              <div className="grid grid-cols-2 gap-y-8 relative">
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Actual Cost</p>
                  <p className="text-3xl font-black">${formatCurrency(effectiveRealCost)}</p>
                  <p className="text-[10px] text-white/30 font-medium mt-1">Reflects {realDuration}h usage</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Amount Already Paid</p>
                  <p className="text-3xl font-black text-emerald-400">${formatCurrency(amountPaid)}</p>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/10 relative">
                <div className={cn(
                  "flex justify-between items-center p-6 rounded-3xl",
                  balance > 0 ? "bg-orange-500/10 border border-orange-500/20" : "bg-emerald-500/10 border border-emerald-500/20"
                )}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Final Balance</p>
                    <p className="text-4xl font-black">
                      ${formatCurrency(Math.abs(balance))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-black uppercase px-3 py-1 rounded-full",
                      balance > 0 ? "bg-orange-500 text-white" : "bg-emerald-500 text-white"
                    )}>
                      {balance > 0 ? "Pending Payment" : balance < 0 ? "Refund Due" : "Settled"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Adjust Duration (Admin Only) */}
            {mode === 'admin' && (
              <div className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-gray-100 space-y-6">
                <div className="flex items-center gap-3">
                  <Timer size={18} className="text-blue-500" />
                  <h4 className="text-sm font-black text-gray-900 uppercase">Override billable time</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <label className="absolute left-5 top-3 text-[9px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-black transition-colors">Days</label>
                    <Input 
                      type="number" min="0" 
                      className="h-20 pt-8 rounded-2xl bg-white border-2 border-transparent focus:border-black font-black text-2xl transition-all shadow-sm"
                      value={actualDays} onChange={e => {
                        setActualDays(parseInt(e.target.value) || 0);
                        setIsManualOverride(true);
                      }}
                    />
                  </div>
                  <div className="relative group">
                    <label className="absolute left-5 top-3 text-[9px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-black transition-colors">Hours</label>
                    <Input 
                      type="number" min="0" max="23"
                      className="h-20 pt-8 rounded-2xl bg-white border-2 border-transparent focus:border-black font-black text-2xl transition-all shadow-sm"
                      value={actualHours} onChange={e => {
                        setActualHours(parseInt(e.target.value) || 0);
                        setIsManualOverride(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Incidents & Notes */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 ml-2">
              <History size={20} className="text-blue-600" />
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Incidents & Notes</h3>
            </div>

            <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-sm">
              {reservation.incidentReportedAt && (
                <div className="bg-orange-50 text-orange-800 p-4 rounded-2xl flex items-start gap-3 border border-orange-100">
                  <AlertCircle size={20} className="shrink-0 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Incident Reported</p>
                    <p className="text-xs font-medium text-orange-600/80 mt-1">
                      By: {(reservation as any).incidentReportedBy?.name || (reservation as any).incidentReportedBy?.email || 'Unknown User'} <br/>
                      On: {formatNIDate(reservation.incidentReportedAt)}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reporting Category</label>
                <Select value={incidentType} onValueChange={(val) => setIncidentType(val || 'NONE')} disabled={reservation.status === 'COMPLETED'}>
                  <SelectTrigger className="h-16 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-black text-sm font-bold">
                    <SelectValue placeholder="No incidents recorded" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2 z-9999" sideOffset={5}>
                    <SelectItem value="NONE" className="font-bold">None (Standard Return)</SelectItem>
                    <SelectItem value="MECHANICAL" className="font-bold">Mechanical Failure (Bike Issue)</SelectItem>
                    <SelectItem value="TECHNICAL" className="font-bold">Technical Error (App/System)</SelectItem>
                    <SelectItem value="OTHER" className="font-bold">Other Reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Only admins can set responsibility */}
              {incidentType !== 'NONE' && mode === 'admin' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Responsibility</label>
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-50 rounded-2xl">
                    <button 
                      onClick={() => setIncidentCategory('COMPANY_FAULT')}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                        incidentCategory === 'COMPANY_FAULT' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'
                      )}
                    >
                      Company Fault (100% Refund)
                    </button>
                    <button 
                      onClick={() => setIncidentCategory('CUSTOMER_FAULT')}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                        incidentCategory === 'CUSTOMER_FAULT' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'
                      )}
                    >
                      Customer Fault
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Justification / Detail</label>
                <textarea
                  placeholder={incidentType === 'NONE' ? "Optional notes about the return..." : "Please describe the incident in detail..."}
                  className={cn(
                    "w-full h-40 p-6 rounded-[2rem] border-2 outline-none transition-all text-sm font-medium resize-none",
                    incidentType !== 'NONE' ? "bg-blue-50/50 border-blue-200 focus:border-blue-500" : "bg-gray-50 border-gray-100 focus:border-black"
                  )}
                  value={incidentNotes}
                  onChange={e => setIncidentNotes(e.target.value)}
                  disabled={reservation.status === 'COMPLETED'}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-[2rem] border-2 border-gray-100 border-dashed">
              <div className="bg-black text-white w-12 h-12 rounded-xl flex items-center justify-center font-black shadow-lg">
                {clientName.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acknowledged by Client</p>
                <p className="font-bold text-gray-900">{clientName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full pt-6">
          <Button variant="outline" onClick={onClose} className="h-14 sm:h-16 rounded-2xl flex-1 border-2 font-bold text-base">
            Close
          </Button>
          {(mode === 'admin' && (reservation.status === 'ACTIVE' || reservation.status === 'SETTLEMENT_PENDING' || reservation.status === 'COMPLETED')) && (
            <Button 
              onClick={handleAction} 
              disabled={loading || realDuration < 0 || reservation.status === 'COMPLETED'}
              className={cn(
                "h-14 sm:h-16 rounded-2xl flex-2 font-black transition-all flex items-center justify-center gap-2 text-base",
                reservation.status === 'ACTIVE' 
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100" 
                  : "bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100",
                "hover:scale-[1.01] active:scale-95 shadow-xl"
              )}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <ShieldCheck size={20} />
              )}
              {reservation.status === 'ACTIVE' ? 'Confirm & Close Ride' : 'Confirm Financial Settlement'}
            </Button>
          )}
          {(mode === 'user' && incidentType !== 'NONE' && reservation.status !== 'COMPLETED') && (
            <Button 
              onClick={handleAction} 
              disabled={loading || incidentNotes.length < 5}
              className={cn(
                "h-14 sm:h-16 rounded-2xl flex-2 font-black transition-all flex items-center justify-center gap-2 text-base",
                "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.01] active:scale-95 shadow-xl shadow-blue-100"
              )}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <AlertCircle size={20} />
              )}
              Submit Incident Report
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
