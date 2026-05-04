import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bike, User, Clock, ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Reservation } from '@/types';

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white rounded-[2rem] p-0 border-0 shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 h-full">
          
          {/* Left Sidebar: Summary */}
          <div className="md:col-span-2 bg-gray-50 p-8 border-r">
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Client Information</h3>
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl">
                    {clientName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{clientName}</p>
                    <p className="text-xs text-gray-500">ID: {clientDoc}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Rental Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Bike size={16} className="text-gray-400" />
                    <span className="font-medium">Bike #{reservation.bike?.code || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-gray-400" />
                    <span className="font-medium">Est. Duration: {Math.ceil((new Date(reservation.endTime || '').getTime() - new Date(reservation.startTime).getTime()) / 3600000)} hours</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <ShieldCheck size={16} className="text-green-500" />
                    <span className="font-medium">Rate: ${reservation.ratePerHour}/hr</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-600">Total Price Estimated</span>
                  <span className="text-xl font-black">${reservation.priceEstimated?.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Includes base rental and selected extras.</p>
              </div>
            </div>
          </div>

          {/* Right Content: Check-in Form */}
          <div className="md:col-span-3 p-8 bg-white">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-black text-gray-900">Check-in Process</DialogTitle>
              <p className="text-gray-500 text-sm">Verify bike condition and legal requirements before starting.</p>
            </DialogHeader>

            <div className="space-y-6">
              {/* Bike Condition */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-900 uppercase flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" /> Bike Condition
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {['GOOD', 'REGULAR', 'DAMAGED'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={`py-3 rounded-2xl font-bold border-2 transition-all ${condition === c ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Additional notes about bike status..."
                  className="w-full h-24 p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-black outline-none transition-all text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Legal Checkboxes */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-black text-gray-900 uppercase flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" /> Legal & Responsibility
                </h4>
                
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all">
                    <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-black" />
                    <span className="text-xs text-gray-700 font-medium leading-relaxed">
                      I have read and accept the <strong>Terms of Service</strong> and privacy policy of the rental.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all">
                    <input type="checkbox" checked={responsibilityAccepted} onChange={e => setResponsibilityAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-black" />
                    <span className="text-xs text-gray-700 font-medium leading-relaxed">
                      I take full <strong>financial responsibility</strong> for any damage or loss of the bicycle during the rental period.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all">
                    <input type="checkbox" checked={penaltyAccepted} onChange={e => setPenaltyAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-black" />
                    <span className="text-xs text-gray-700 font-medium leading-relaxed">
                      I understand that <strong>late returns</strong> will incur an additional penalty fee of $10 per hour.
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-4">
                <Button variant="outline" onClick={onClose} className="h-14 rounded-2xl flex-1 border-2 font-bold">Cancel</Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !allAccepted}
                  className={`h-14 rounded-2xl flex-[2] font-black transition-all flex items-center justify-center gap-2 ${allAccepted ? 'bg-black text-white hover:scale-[1.02]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <CheckCircle2 size={20} />}
                  Confirm & Start Ride
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
