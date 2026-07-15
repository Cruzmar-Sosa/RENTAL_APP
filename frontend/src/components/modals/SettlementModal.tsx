"use client";

import { useState, useEffect, useRef } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, Calculator, AlertCircle, Timer, History, DollarSign, ShieldCheck, Zap, Info } from 'lucide-react';
import { Reservation } from '@/types';
import { cn } from '@/lib/utils';
import { formatNIDate, formatNIDateOnly, formatNITimeOnly } from '@/lib/dateUtils';
import { formatCurrency } from '@/lib/financial';
import { useSettlement } from '@/hooks/useSettlement';
import { normalizeSettlementPreview } from '@/lib/financial-adapters';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onConfirm?: (id: string, action: string, data?: any) => Promise<void>;
  mode?: 'admin' | 'user';
}

export function SettlementModal({ isOpen, onClose, reservation, onConfirm, mode = 'admin' }: SettlementModalProps) {
  const { preview, isLoading: previewLoading, fetchPreview, settleReservation, completeAndSettle } = useSettlement();
  const [loading, setLoading] = useState(false);
  const [incidentType, setIncidentType] = useState(reservation?.incidentType || 'NONE');
  const [incidentCategory, setIncidentCategory] = useState(reservation?.incidentCategory || 'CUSTOMER_FAULT');
  const [incidentNotes, setIncidentNotes] = useState(reservation?.incidentNotes || '');
  const isSubmitting = useRef(false);

  useEffect(() => {
    if (isOpen && reservation?.id) {
      fetchPreview(reservation.id);
    }
  }, [isOpen, reservation?.id]);

  if (!reservation) return null;

  // Use normalized calculation values from API preview, fallback to mock display structure if loading
  const normalizedPreview = preview ? normalizeSettlementPreview(preview) : null;
  const calc = normalizedPreview?.calculation || {
    estimatedDurationHours: 0,
    actualDurationHours: 0,
    overtimeHours: 0,
    isEarlyReturn: false,
    isLateReturn: false,
    ratePerHour: Number(reservation.ratePerHour) || 50,
    estimatedCost: Number(reservation.priceEstimated) || 0,
    actualBaseCost: 0,
    extrasTotal: Number(reservation.extrasTotal) || 0,
    overtimeCharges: 0,
    incidentCharges: 0,
    incidentCredits: 0,
    damageCharges: 0,
    latePenalty: 0,
    totalPaid: 0,
    depositAmount: 0,
    upfrontAmount: 0,
    grossTotal: 0,
    creditsApplied: 0,
    netTotal: 0,
    balance: 0,
    recommendedFinancialStatus: 'PENDING',
    recommendedAction: 'SETTLED',
  };

  const handleAction = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    try {
      if (mode === 'admin') {
        const idempotencyKey = `idemp-${Date.now()}-${reservation.id.slice(0, 4)}`;
        if (reservation.status === 'ACTIVE') {
          // Unified Complete and Settle via Orchestrator
          await completeAndSettle(reservation.id, idempotencyKey);
        } else {
          // Final Settlement
          await settleReservation(reservation.id, idempotencyKey);
        }
        if (onConfirm) {
          await onConfirm(reservation.id, 'settle');
        }
      } else {
        // User Mode: Submitting an incident report
        if (incidentType !== 'NONE' && onConfirm) {
          await onConfirm(reservation.id, 'report-incident', {
            incidentType,
            incidentNotes,
          });
        }
      }
      onClose();
    } catch (error) {
      console.error('[SettlementModal] Action failed:', error);
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
            {mode === 'admin' ? 'Ride Settlement (Server-Authoritative)' : 'Ride Details & Timeline'}
          </h2>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-widest text-[10px]">
            {mode === 'admin' ? 'Review & Finalize Financials' : 'View usage and report incidents'}
          </p>
        </div>
      </div>

      {previewLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="text-sm font-bold text-gray-500">Calculating authoritative totals on server...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Top Stats: Duration Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Estimated Time', value: `${calc.estimatedDurationHours}h`, icon: Clock, color: 'text-gray-400' },
              { label: 'Authoritative Usage', value: `${calc.actualDurationHours}h`, icon: Timer, color: 'text-emerald-600' },
              { 
                label: 'Overtime Hours', 
                value: `${calc.overtimeHours}h`, 
                icon: History, 
                color: calc.isLateReturn ? 'text-orange-500' : 'text-blue-500' 
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
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">🕒 Check-out / Current Snapshot</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-black text-gray-900">
                    {formatNIDateOnly(reservation.actualEnd || new Date())}
                  </p>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                  <p className="text-xl font-black text-blue-600">
                    {formatNITimeOnly(reservation.actualEnd || new Date())}
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
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Base Rental Cost</p>
                    <p className="text-2xl font-black">${formatCurrency(calc.actualBaseCost)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Amount Already Paid</p>
                    <p className="text-2xl font-black text-emerald-400">${formatCurrency(calc.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Overtime Charges</p>
                    <p className="text-2xl font-black text-orange-400">${formatCurrency(calc.overtimeCharges)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Late Penalty</p>
                    <p className="text-2xl font-black text-red-400">${formatCurrency(calc.latePenalty)}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 relative">
                  <div className="flex justify-between items-center text-xs opacity-70">
                    <span>Incident Charges:</span>
                    <span>${formatCurrency(calc.incidentCharges)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs opacity-70">
                    <span>Incident Credits:</span>
                    <span>-${formatCurrency(calc.creditsApplied)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs opacity-70">
                    <span>Extras Total:</span>
                    <span>${formatCurrency(calc.extrasTotal)}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 relative">
                  <div className={cn(
                    "flex justify-between items-center p-6 rounded-3xl",
                    calc.balance > 0 ? "bg-orange-500/10 border border-orange-500/20" : "bg-emerald-500/10 border border-emerald-500/20"
                  )}>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Final Balance</p>
                      <p className="text-4xl font-black">
                        ${formatCurrency(Math.abs(calc.balance))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xs font-black uppercase px-3 py-1 rounded-full",
                        calc.balance > 0 ? "bg-orange-500 text-white" : "bg-emerald-500 text-white"
                      )}>
                        {calc.recommendedAction === 'COLLECT' ? "Pending Payment" : calc.recommendedAction === 'REFUND' ? "Refund Due" : "Settled"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full pt-6">
            <Button variant="outline" onClick={onClose} className="h-14 sm:h-16 rounded-2xl flex-1 border-2 font-bold text-base">
              Close
            </Button>
            {mode === 'admin' && (reservation.status === 'ACTIVE' || reservation.status === 'SETTLEMENT_PENDING' || reservation.status === 'COMPLETED') && (
              <Button 
                onClick={handleAction} 
                disabled={loading || reservation.status === 'COMPLETED'}
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
            {mode === 'user' && incidentType !== 'NONE' && reservation.status !== 'COMPLETED' && (
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
      )}
    </BaseModal>
  );
}
