import { useState, useEffect } from 'react';
import { AppModal } from '@/components/ui/app-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bike, User, Clock, CreditCard, ShieldCheck, Search, Plus, UserPlus, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { User as UserType } from '@/types';
import { cn } from '@/lib/utils';

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
  const [hasInteractedWithTime, setHasInteractedWithTime] = useState(false);

  // Dynamic Time logic (Guard: No user server time)
  useEffect(() => {
    if (isOpen && !hasInteractedWithTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setStartDate(`${year}-${month}-${day}`);
        setStartTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, hasInteractedWithTime]);

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
        targetUserId: identityMode === 'REGISTERED' ? targetUser?.id : null,
        clientName: identityMode === 'REGISTERED' ? targetUser?.name : guestName,
        clientPhone: identityMode === 'REGISTERED' ? targetUser?.phone : guestPhone,
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

  const modalTitle = (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2.5 rounded-xl">
            <Bike size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black">Reservation Wizard</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Create New Rental Session</span>
          </div>
        </div>
        <div className="hidden sm:flex bg-gray-100 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-gray-500">
          Step {step} of 4
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div 
            key={s} 
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-500",
              s <= step ? 'bg-black' : 'bg-gray-100'
            )} 
          />
        ))}
      </div>
    </div>
  );

  const modalFooter = (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      {step > 1 && (
        <Button 
          variant="outline" 
          onClick={handlePrev} 
          className="h-14 sm:h-16 rounded-2xl flex-1 border-2 font-bold gap-2 text-base"
        >
          <ChevronLeft size={20} /> Back
        </Button>
      )}
      {step < 4 ? (
        <Button 
          onClick={handleNext} 
          disabled={(step === 1 && ((identityMode === 'REGISTERED' && !targetUser) || (identityMode === 'GUEST' && (!guestName || !guestDoc))))}
          className="h-14 sm:h-16 rounded-2xl flex-2 font-black bg-black text-white hover:scale-[1.01] active:scale-95 transition-all gap-2 text-base"
        >
          Continue <ChevronRight size={20} />
        </Button>
      ) : (
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="h-14 sm:h-16 rounded-2xl flex-2 font-black bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.01] active:scale-95 transition-all gap-2 text-base"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <ShieldCheck size={20} />
          )}
          Complete Reservation
        </Button>
      )}
    </div>
  );

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      footer={modalFooter}
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Customer Identification</h3>
                <p className="text-sm text-gray-500 font-medium">Select an existing customer or register a new guest</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-1.5 bg-gray-100 rounded-[1.5rem]">
              <button 
                onClick={() => setIdentityMode('REGISTERED')}
                className={cn(
                  "flex items-center justify-center gap-3 py-4 rounded-xl font-black transition-all text-sm uppercase tracking-widest",
                  identityMode === 'REGISTERED' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Search size={18} /> Registered
              </button>
              <button 
                onClick={() => setIdentityMode('GUEST')}
                className={cn(
                  "flex items-center justify-center gap-3 py-4 rounded-xl font-black transition-all text-sm uppercase tracking-widest",
                  identityMode === 'GUEST' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <UserPlus size={18} /> New Guest
              </button>
            </div>

            {identityMode === 'REGISTERED' ? (
              <div className="space-y-6">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
                  <Input 
                    placeholder="Search by name, email or document..." 
                    className="pl-14 h-16 rounded-2xl bg-gray-50 border-gray-200 focus:bg-white text-lg font-medium transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searching && <div className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-64 overflow-y-auto border-2 border-gray-100 rounded-3xl divide-y-2 divide-gray-50 shadow-sm">
                    {searchResults.map((u) => (
                      <div 
                        key={u.id} 
                        onClick={() => { setTargetUser(u); setSearchResults([]); setSearchQuery(u.name); }}
                        className="p-5 hover:bg-gray-50 cursor-pointer flex justify-between items-center group transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-gray-100 text-gray-500 w-12 h-12 rounded-xl flex items-center justify-center font-black group-hover:bg-black group-hover:text-white transition-all">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{u.email} • {u.documentNumber}</p>
                          </div>
                        </div>
                        <Plus size={20} className="text-gray-300 group-hover:text-black group-hover:scale-110 transition-all" />
                      </div>
                    ))}
                  </div>
                )}

                {targetUser && (
                  <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-[2rem] flex items-center gap-6 animate-in zoom-in-95">
                    <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl uppercase shadow-lg shadow-blue-200">
                      {targetUser.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Selected Customer</p>
                      <p className="text-xl font-black text-blue-900 leading-tight">{targetUser.name}</p>
                      <p className="text-sm text-blue-700 font-bold opacity-80 mt-1">{targetUser.documentType}: {targetUser.documentNumber}</p>
                    </div>
                    <div className="bg-blue-200/50 p-2 rounded-xl text-blue-600">
                      <ShieldCheck size={24} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <Input placeholder="John Doe" className="h-16 rounded-2xl bg-gray-50 border-gray-200 focus:bg-white text-lg" value={guestName} onChange={e => setGuestName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Document ID</label>
                  <Input placeholder="ID Number" className="h-16 rounded-2xl bg-gray-50 border-gray-200 focus:bg-white text-lg" value={guestDoc} onChange={e => setGuestDoc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <Input placeholder="+1 234..." className="h-16 rounded-2xl bg-gray-50 border-gray-200 focus:bg-white text-lg" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Timing & Duration</h3>
                <p className="text-sm text-gray-500 font-medium">Set when the rental starts and for how long</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setHasInteractedWithTime(true); }} className="h-16 rounded-2xl bg-gray-50 border-gray-200 text-lg font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Start Time</label>
                <Input type="time" value={startTime} onChange={e => { setStartTime(e.target.value); setHasInteractedWithTime(true); }} className="h-16 rounded-2xl bg-gray-50 border-gray-200 text-lg font-bold" />
              </div>
            </div>

            <div className="p-10 bg-gray-50 rounded-[3rem] border-2 border-gray-100">
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 text-center">Rental Duration Selection</p>
              <div className="flex items-center justify-center gap-8">
                <div className="flex flex-col items-center">
                  <Input 
                    type="number" min="0" 
                    value={days} onChange={e => setDays(parseInt(e.target.value) || 0)} 
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] text-center text-4xl font-black border-4 border-white bg-white shadow-xl focus:ring-black focus:border-black transition-all" 
                  />
                  <p className="text-xs font-black text-gray-500 uppercase mt-4 tracking-widest">Days</p>
                </div>
                <div className="text-4xl font-black text-gray-300 mb-8">:</div>
                <div className="flex flex-col items-center">
                  <Input 
                    type="number" min="0" max="23" 
                    value={hours} onChange={e => setHours(parseInt(e.target.value) || 0)} 
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] text-center text-4xl font-black border-4 border-white bg-white shadow-xl focus:ring-black focus:border-black transition-all" 
                  />
                  <p className="text-xs font-black text-gray-500 uppercase mt-4 tracking-widest">Hours</p>
                </div>
              </div>
              
              <div className="mt-10 pt-8 border-t-2 border-gray-200/50 flex flex-col items-center">
                <div className="flex items-center gap-2 text-gray-400 font-bold mb-1">
                  <Clock size={16} />
                  <span>Total Billable Time</span>
                </div>
                <div className="text-2xl font-black text-black">
                  {days > 0 && `${days} Day${days > 1 ? 's' : ''} `}
                  {hours > 0 && `${hours} Hour${hours > 1 ? 's' : ''}`}
                  {days === 0 && hours === 0 && '0 Hours'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Extras */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Pricing & Add-ons</h3>
                <p className="text-sm text-gray-500 font-medium">Customize rates and include additional services</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Rate per Hour (USD)</label>
                  <p className="text-sm text-gray-500 font-medium">Base rate for this specific rental</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-400">$</span>
                    <Input 
                      type="number" 
                      value={ratePerHour} 
                      onChange={e => setRatePerHour(parseInt(e.target.value) || 0)} 
                      className="h-16 w-32 pl-8 rounded-2xl bg-gray-50 text-2xl font-black border-none focus:ring-2 focus:ring-black transition-all" 
                    />
                  </div>
                  <div className="h-10 w-px bg-gray-200 hidden md:block" />
                  <div className="bg-gray-100 px-6 py-3 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Cost</p>
                    <p className="text-lg font-black text-black">${baseCost.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Optional Extras & Protection</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {extras.map((extra) => (
                  <div 
                    key={extra.id}
                    onClick={() => toggleExtra(extra.id)}
                    className={cn(
                      "group p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden",
                      extra.selected 
                        ? 'border-emerald-600 bg-emerald-50 shadow-lg shadow-emerald-100' 
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      extra.selected ? 'bg-emerald-600 text-white' : 'bg-white text-gray-400 group-hover:text-black'
                    )}>
                      {extra.selected ? <ShieldCheck size={20} /> : <Plus size={20} />}
                    </div>
                    <div>
                      <p className={cn("font-black text-sm transition-all", extra.selected ? 'text-emerald-900' : 'text-gray-600')}>{extra.name}</p>
                      <p className={cn("text-lg font-black mt-1", extra.selected ? 'text-emerald-600' : 'text-gray-900')}>+${extra.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Checkout */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Summary & Payment</h3>
                <p className="text-sm text-gray-500 font-medium">Review the final details and select payment method</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-black text-white p-8 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <CreditCard size={120} />
                </div>
                
                <div className="space-y-1 relative">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Estimated Total</p>
                  <p className="text-5xl font-black tracking-tight">${totalCost.toFixed(2)}</p>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10 relative">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-white/50">Base Rental ({totalHours}h)</span>
                    <span className="font-black">${baseCost.toFixed(2)}</span>
                  </div>
                  {extras.filter(e => e.selected).map(e => (
                    <div key={e.id} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-white/50">{e.name}</span>
                      <span className="font-black">+${e.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 relative">
                  <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase">Security Deposit (20%)</p>
                      <p className="text-xl font-black text-white">${depositCost.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Select Payment Strategy</p>
                <div className="space-y-3">
                  {[
                    { id: 'DEPOSIT', title: 'Security Deposit', desc: 'Pay 20% now to confirm', amount: depositCost, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'FULL', title: 'Full Upfront', desc: 'Settle everything today', amount: totalCost, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { id: 'LATER', title: 'Pay at Check-in', desc: '15 min temporary hold', amount: 0, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map((opt: any) => (
                    <div 
                      key={opt.id}
                      onClick={() => setPaymentOption(opt.id as any)}
                      className={cn(
                        "p-5 rounded-3xl border-2 transition-all cursor-pointer flex justify-between items-center group",
                        paymentOption === opt.id 
                          ? 'border-black bg-gray-50 shadow-md' 
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl transition-all", paymentOption === opt.id ? opt.bg + ' ' + opt.color : 'bg-gray-100 text-gray-400')}>
                          <opt.icon size={20} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{opt.title}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">{opt.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-gray-900">${opt.amount.toFixed(2)}</p>
                        {paymentOption === opt.id && <div className="h-1.5 w-full bg-black rounded-full mt-1.5 animate-in slide-in-from-right-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {paymentOption === 'LATER' && (
              <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-[2rem] flex gap-5 items-start animate-in slide-in-from-bottom-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                  <Info size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Temporary Hold Policy</p>
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">
                    The bike will be held for exactly <strong className="font-black text-amber-950">15 minutes</strong>. If not paid or checked-in by then, the reservation system will auto-release the unit for other customers.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppModal>
  );
}

// Helper for missing Zap icon if not imported
const Zap = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} 
    viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" 
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    className={className}
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
