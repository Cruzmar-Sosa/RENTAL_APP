import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bike, User, Clock, CreditCard, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  bikeId: string | null;
  onConfirm: (payload: any) => Promise<void>;
  user: any;
}

export function ReserveModal({ isOpen, onClose, bikeId, onConfirm, user }: ReserveModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [duration, setDuration] = useState(2); // hours
  const [paymentOption, setPaymentOption] = useState<'DEPOSIT' | 'FULL' | 'LATER'>('DEPOSIT');

  const PRICE_PER_HOUR = 50;
  const totalCost = duration * PRICE_PER_HOUR;
  const depositCost = totalCost * 0.2; // 20% deposit

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Calcular startTime (ahora) y endTime (ahora + duration)
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
      
      // El administrador o el sistema decide cuándo expira si no paga.
      // Por defecto: 2 horas desde ahora.
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

      await onConfirm({
        bikeId,
        documentType: docType,
        documentNumber: docNumber,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        expiresAt: expiresAt.toISOString(),
        paymentOption
      });
      onClose();
      setStep(1);
    } catch (error) {
      toast.error('Failed to reserve bike.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-3xl p-6 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center flex items-center justify-center gap-2">
            <Bike size={24} /> Reserve Bicycle
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                <User size={16} /> Step 1: Identity
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Document Type</label>
                <Select value={docType} onValueChange={(val) => val && setDocType(val)}>
                  <SelectTrigger className="mt-1 h-12 rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">National ID (DNI)</SelectItem>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Document Number</label>
                <Input 
                  placeholder="e.g. 123456789" 
                  className="mt-1 h-12 rounded-xl"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                />
              </div>
              <Button onClick={handleNext} className="w-full h-12 mt-4 rounded-xl font-bold bg-black text-white hover:bg-gray-800" disabled={!docNumber}>
                Next Step
              </Button>
            </div>
          )}

          {/* Step 2: Time & Duration */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Clock size={16} /> Step 2: Duration
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Estimated Duration (Hours)</label>
                <Input 
                  type="number"
                  min="1"
                  max="24"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="mt-1 h-12 rounded-xl text-lg font-bold"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handlePrev} className="h-12 rounded-xl w-1/3">Back</Button>
                <Button onClick={handleNext} className="h-12 rounded-xl font-bold bg-black text-white hover:bg-gray-800 w-2/3">
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                <CreditCard size={16} /> Step 3: Checkout
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 mb-4">
                <div className="flex justify-between text-sm font-medium text-gray-600">
                  <span>Rate per hour:</span>
                  <span>${PRICE_PER_HOUR}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-600">
                  <span>Duration:</span>
                  <span>{duration} hours</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-black text-lg">
                  <span>Total Estimated:</span>
                  <span>${totalCost}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600">Payment Option</label>
                <div 
                  className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${paymentOption === 'DEPOSIT' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                  onClick={() => setPaymentOption('DEPOSIT')}
                >
                  <div className="flex justify-between font-bold">
                    <span>Pay Deposit (20%)</span>
                    <span>${depositCost}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Pay the rest after the ride.</p>
                </div>
                
                <div 
                  className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${paymentOption === 'FULL' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                  onClick={() => setPaymentOption('FULL')}
                >
                  <div className="flex justify-between font-bold">
                    <span>Pay Full Amount</span>
                    <span>${totalCost}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Settle everything now.</p>
                </div>

                <div 
                  className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${paymentOption === 'LATER' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                  onClick={() => setPaymentOption('LATER')}
                >
                  <div className="flex justify-between font-bold">
                    <span>Pay Later (Hold)</span>
                    <span>$0.00</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Bike will be held for 2 hours.</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handlePrev} className="h-12 rounded-xl w-1/3">Back</Button>
                <Button onClick={handleSubmit} disabled={loading} className="h-12 rounded-xl font-bold bg-black text-white hover:bg-gray-800 w-2/3 flex items-center justify-center gap-2">
                  <ShieldCheck size={18} /> Confirm Reserve
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
