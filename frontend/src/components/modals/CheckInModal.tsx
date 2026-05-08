"use client";

import { useState } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/button';
import { Bike, Clock, ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Reservation } from '@/types';
import { cn } from '@/lib/utils';
import { calculateDurationHours } from '@/lib/dateUtils';
import { formatCurrency } from '@/lib/financial';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onConfirm: (id: string, data: any) => Promise<void>;
}

export function CheckInModal({ isOpen, onClose, reservation, onConfirm }: CheckInModalProps) {
  const [loading, setLoading] = useState(false);
  const [condition, setCondition] = useState('GOOD');
  const [notes, setNotes] = useState('');
  
  // Legal
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);
  const [penaltyAccepted, setPenaltyAccepted] = useState(false);

  const allAccepted = termsAccepted && responsibilityAccepted && penaltyAccepted;

  if (!reservation) return null;

  const handleSubmit = async () => {
    if (!allAccepted) {
      toast.error('Please accept all terms to continue');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(reservation.id, {
        bikeCondition: condition,
        bikeNotes: notes,
        termsAccepted: true
      });
      onClose();
    } catch (error) {
      toast.error('Failed to start ride');
    } finally {
      setLoading(false);
    }
  };

  const clientName = reservation.guestName || reservation.clientName || reservation.user?.name || 'Unknown';
  const clientDoc = reservation.guestDocument || reservation.user?.documentNumber || 'N/A';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      showFooter={false}
      className="max-w-6xl"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-black text-white rounded-2xl">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">Check-in Process</h2>
          <p className="text-sm text-gray-500 font-medium tracking-normal">Complete the verification to start the ride</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Summary Side */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-gray-100 space-y-8">
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Client Identity</h3>
              <div className="flex items-center gap-5">
                <div className="bg-white text-black border-2 border-gray-200 w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-sm">
                  {clientName.charAt(0)}
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 leading-tight">{clientName}</p>
                  <p className="text-sm text-gray-500 font-bold mt-1">ID: {clientDoc}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200/50" />

            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Reservation Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400 group-hover:text-black transition-colors">
                    <Bike size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Unit Code</span>
                    <span className="font-bold text-gray-900">#{reservation.bike?.code || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400 group-hover:text-orange-500 transition-colors">
                    <Clock size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Estimated Duration</span>
                    <span className="font-bold text-gray-900">{calculateDurationHours(reservation.startTime, reservation.endTime || '')} Hours</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400 group-hover:text-green-500 transition-colors">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Active Rate</span>
                    <span className="font-bold text-gray-900">${formatCurrency(reservation.ratePerHour)}/hr</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t-2 border-dashed border-gray-200">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Estimated</span>
                  <p className="text-3xl font-black text-black">${formatCurrency(reservation.priceEstimated)}</p>
                </div>
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <FileText size={20} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-[2rem] flex gap-4">
            <InfoIcon size={24} className="text-blue-500 shrink-0" />
            <p className="text-xs text-blue-800 font-bold leading-relaxed">
              Ensure the customer inspects the bike condition thoroughly before signing the agreement.
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="lg:col-span-3 space-y-10">
          {/* Bike Condition */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Bike Delivery Condition</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['GOOD', 'REGULAR', 'DAMAGED'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={cn(
                    "py-4 rounded-2xl font-black border-2 transition-all text-xs tracking-widest uppercase",
                    condition === c 
                      ? 'border-black bg-black text-white shadow-xl scale-[1.02]' 
                      : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-600'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Record any scratches, low tire pressure, or mechanical observations here..."
              className="w-full h-32 p-6 rounded-[2rem] bg-gray-50 border-2 border-gray-100 focus:border-black focus:bg-white outline-none transition-all text-sm font-medium resize-none shadow-inner"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Legal Checkboxes */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <FileText size={20} />
              </div>
              <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Legal & Responsibility</h4>
            </div>
            
            <div className="space-y-3">
              {[
                { 
                  id: 'terms', 
                  checked: termsAccepted, 
                  setter: setTermsAccepted, 
                  label: <>I have read and accept the <strong className="font-black">Terms of Service</strong> and privacy policy.</> 
                },
                { 
                  id: 'resp', 
                  checked: responsibilityAccepted, 
                  setter: setResponsibilityAccepted, 
                  label: <>I take full <strong className="font-black">financial responsibility</strong> for any damage or loss of the bicycle.</> 
                },
                { 
                  id: 'penalty', 
                  checked: penaltyAccepted, 
                  setter: setPenaltyAccepted, 
                  label: <>I understand that <strong className="font-black">late returns</strong> incur a penalty fee of $10 per hour.</> 
                }
              ].map((item) => (
                <label 
                  key={item.id}
                  className={cn(
                    "flex items-start gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all group",
                    item.checked 
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-sm' 
                      : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                  )}
                >
                  <div className={cn(
                    "mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                    item.checked ? 'bg-emerald-600 border-emerald-600 shadow-md shadow-emerald-100' : 'border-gray-300 bg-white group-hover:border-gray-400'
                  )}>
                    {item.checked && <CheckCircle2 size={16} className="text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={item.checked} 
                    onChange={e => item.setter(e.target.checked)} 
                    className="hidden" 
                  />
                  <span className={cn(
                    "text-sm font-medium leading-relaxed",
                    item.checked ? 'text-emerald-950' : 'text-gray-600'
                  )}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Unified Action Footer */}
      <div className="flex flex-col sm:flex-row gap-4 w-full pt-8 mt-10 border-t-2 border-gray-50">
        <Button variant="outline" onClick={onClose} className="h-14 sm:h-16 rounded-2xl flex-1 border-2 font-bold text-base">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !allAccepted}
          className={cn(
            "h-14 sm:h-16 rounded-2xl flex-2 font-black transition-all flex items-center justify-center gap-2 text-base shadow-xl",
            allAccepted 
              ? 'bg-black text-white hover:scale-[1.01] active:scale-95' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-100 shadow-none'
          )}
        >
          {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <CheckCircle2 size={20} />}
          Confirm & Start Ride
        </Button>
      </div>
    </BaseModal>
  );
}

const InfoIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} 
    viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" 
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
