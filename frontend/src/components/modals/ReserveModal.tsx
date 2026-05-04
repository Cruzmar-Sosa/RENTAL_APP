import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bike, User, Clock, CreditCard, ShieldCheck, Search, Plus, UserPlus, Info } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { User as UserType } from '@/types';

interface ReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  bikeId: string | null;
  onConfirm: (payload: any) => Promise<void>;
  user: any; // Logged in user
}

export function ReserveModal({ isOpen, onClose, bikeId, onConfirm, user }: ReserveModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [identityMode, setIdentityMode] = useState<'REGISTERED' | 'GUEST'>('REGISTERED');
  const [targetUser, setTargetUser] = useState<UserType | null>(null);
  
  // Guest Fields
  const [guestName, setGuestName] = useState('');
  const [guestDoc, setGuestDoc] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Schedule Fields
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(2);

  // Extras & Pricing
  const [ratePerHour, setRatePerHour] = useState(50);
  const [extras, setExtras] = useState([
    { id: 'helmet', name: 'Helmet', price: 10, selected: false },
    { id: 'insurance', name: 'Premium Insurance', price: 15, selected: false },
    { id: 'lock', name: 'Extra Security Lock', price: 5, selected: false },
  ]);

  const [paymentOption, setPaymentOption] = useState<'DEPOSIT' | 'FULL' | 'LATER'>('DEPOSIT');

  // Calculations
  const extrasTotal = extras.filter(e => e.selected).reduce((acc, curr) => acc + curr.price, 0);
  const totalHours = (days * 24) + hours;
  const baseCost = totalHours * ratePerHour;
  const totalCost = baseCost + extrasTotal;
  const depositCost = totalCost * 0.2;

  // Search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setSearching(true);
        try {
          const { data } = await api.get(`/users/search?q=${searchQuery}`);
          setSearchResults(data);
        } catch (error) {
          console.error('Search failed', error);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const toggleExtra = (id: string) => {
    setExtras(extras.map(e => e.id === id ? { ...e, selected: !e.selected } : e));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + totalHours * 60 * 60 * 1000);

      const payload = {
        bikeId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        ratePerHour,
        paymentOption,
        extras: extras.filter(e => e.selected).map(e => ({ name: e.name, price: e.price })),
        extrasTotal,
        // Identity
        targetUserId: identityMode === 'REGISTERED' ? targetUser?.id : null,
        clientName: identityMode === 'REGISTERED' ? targetUser?.name : guestName,
        clientPhone: identityMode === 'REGISTERED' ? targetUser?.phone : guestPhone,
        // Guest Snapshot
        guestName: identityMode === 'GUEST' ? guestName : null,
        guestDocument: identityMode === 'GUEST' ? guestDoc : null,
        guestPhone: identityMode === 'GUEST' ? guestPhone : null,
      };

      await onConfirm(payload);
      onClose();
      resetForm();
    } catch (error) {
      toast.error('Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTargetUser(null);
    setGuestName('');
    setGuestDoc('');
    setGuestPhone('');
    setSearchQuery('');
    setExtras(extras.map(e => ({ ...e, selected: false })));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-white rounded-[2rem] p-0 border-0 shadow-2xl overflow-hidden">
        {/* Header with Progress */}
        <div className="bg-black p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bike size={24} />
              </div>
              Reservation Wizard
            </DialogTitle>
            <div className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">
              Step {step} of 4
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-white' : 'bg-white/20'}`} 
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                <User className="text-blue-600" /> Who is renting?
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 rounded-2xl">
                <button 
                  onClick={() => setIdentityMode('REGISTERED')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${identityMode === 'REGISTERED' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                >
                  <Search size={18} /> Registered
                </button>
                <button 
                  onClick={() => setIdentityMode('GUEST')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${identityMode === 'GUEST' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                >
                  <UserPlus size={18} /> Guest
                </button>
              </div>

              {identityMode === 'REGISTERED' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                      placeholder="Search by name, email or document..." 
                      className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searching && <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border rounded-2xl divide-y">
                      {searchResults.map((u) => (
                        <div 
                          key={u.id} 
                          onClick={() => { setTargetUser(u); setSearchResults([]); setSearchQuery(u.name); }}
                          className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                          <Plus size={16} className="text-gray-400" />
                        </div>
                      ))}
                    </div>
                  )}

                  {targetUser && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4">
                      <div className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl uppercase">
                        {targetUser.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-blue-900">{targetUser.name}</p>
                        <p className="text-xs text-blue-700">{targetUser.documentType}: {targetUser.documentNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <Input placeholder="Full Name" className="h-14 rounded-2xl bg-gray-50" value={guestName} onChange={e => setGuestName(e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Document ID" className="h-14 rounded-2xl bg-gray-50" value={guestDoc} onChange={e => setGuestDoc(e.target.value)} />
                    <Input placeholder="Phone" className="h-14 rounded-2xl bg-gray-50" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleNext} 
                className="w-full h-14 rounded-2xl font-bold bg-black text-white hover:scale-[1.02] transition-transform" 
                disabled={(identityMode === 'REGISTERED' && !targetUser) || (identityMode === 'GUEST' && (!guestName || !guestDoc))}
              >
                Continue to Schedule
              </Button>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                <Clock className="text-orange-500" /> When and how long?
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Start Date</label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-14 rounded-2xl bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase ml-1">Start Time</label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-14 rounded-2xl bg-gray-50" />
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                <p className="text-sm font-bold text-gray-600 mb-4 text-center">Rental Duration</p>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <Input type="number" min="0" value={days} onChange={e => setDays(parseInt(e.target.value) || 0)} className="w-20 h-20 rounded-[1.5rem] text-center text-2xl font-black border-2 border-gray-200" />
                    <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Days</p>
                  </div>
                  <div className="text-2xl font-black text-gray-300">:</div>
                  <div className="text-center">
                    <Input type="number" min="0" max="23" value={hours} onChange={e => setHours(parseInt(e.target.value) || 0)} className="w-20 h-20 rounded-[1.5rem] text-center text-2xl font-black border-2 border-gray-200" />
                    <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Hours</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handlePrev} className="h-14 rounded-2xl flex-1 border-2">Back</Button>
                <Button onClick={handleNext} className="h-14 rounded-2xl flex-[2] font-bold bg-black text-white">Next: Extras & Rates</Button>
              </div>
            </div>
          )}

          {/* Step 3: Extras */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                <Plus className="text-green-600" /> Pricing & Add-ons
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase ml-1">Rate per Hour (USD)</label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="number" 
                    value={ratePerHour} 
                    onChange={e => setRatePerHour(parseInt(e.target.value) || 0)} 
                    className="h-14 rounded-2xl bg-gray-50 text-xl font-bold" 
                  />
                  <div className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-500">
                    Base: ${baseCost}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase ml-1">Optional Extras</p>
                {extras.map((extra) => (
                  <div 
                    key={extra.id}
                    onClick={() => toggleExtra(extra.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${extra.selected ? 'border-green-600 bg-green-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${extra.selected ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                        {extra.selected && <Plus size={14} className="text-white" />}
                      </div>
                      <span className={`font-bold ${extra.selected ? 'text-green-900' : 'text-gray-600'}`}>{extra.name}</span>
                    </div>
                    <span className="font-black text-gray-900">+${extra.price}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handlePrev} className="h-14 rounded-2xl flex-1 border-2">Back</Button>
                <Button onClick={handleNext} className="h-14 rounded-2xl flex-[2] font-bold bg-black text-white">Review Summary</Button>
              </div>
            </div>
          )}

          {/* Step 4: Checkout */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 text-lg font-bold text-gray-900">
                <CreditCard className="text-purple-600" /> Checkout
              </div>

              <div className="bg-black text-white p-6 rounded-[2rem] space-y-4 shadow-xl">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-white/40 mb-1">Estimated Total</p>
                    <p className="text-4xl font-black">${totalCost.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-white/40 mb-1">Duration</p>
                    <p className="font-bold">{totalHours}h</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Base Rental</span>
                    <span>${baseCost.toFixed(2)}</span>
                  </div>
                  {extras.filter(e => e.selected).map(e => (
                    <div key={e.id} className="flex justify-between text-sm text-white/60">
                      <span>{e.name}</span>
                      <span>+${e.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase ml-1">Payment Strategy</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'DEPOSIT', title: 'Security Deposit', desc: 'Pay 20% now to confirm', amount: depositCost },
                    { id: 'FULL', title: 'Full Upfront', desc: 'Settle everything today', amount: totalCost },
                    { id: 'LATER', title: 'Pay at Check-in', desc: '15 min temporary hold', amount: 0 },
                  ].map((opt) => (
                    <div 
                      key={opt.id}
                      onClick={() => setPaymentOption(opt.id as any)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${paymentOption === opt.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div>
                        <p className="font-bold">{opt.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black">{opt.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg">${opt.amount.toFixed(2)}</p>
                        {paymentOption === opt.id && <div className="h-1 w-full bg-black rounded-full mt-1" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {paymentOption === 'LATER' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
                  <Info className="text-amber-600 shrink-0" size={18} />
                  <p className="text-xs text-amber-800 font-medium">
                    The bike will be held for <strong>15 minutes</strong>. If not paid or checked-in by then, the reservation will auto-cancel.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button variant="outline" onClick={handlePrev} className="h-14 rounded-2xl flex-1 border-2">Back</Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="h-14 rounded-2xl flex-[2] font-black bg-black text-white hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <ShieldCheck size={20} />}
                  Complete Reservation
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
