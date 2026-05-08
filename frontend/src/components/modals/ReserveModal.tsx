"use client";

import { useState, useMemo, useEffect } from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
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
  mode?: 'admin' | 'user';
}

export function ReserveModal({ isOpen, onClose, bikeId, onConfirm, user, mode }: ReserveModalProps) {
  const currentMode = mode || (user?.role === 'ADMIN' ? 'admin' : 'user');
  
  // Start on step 2 for users, since step 1 is Identity (Admin only)
  const [step, setStep] = useState(1);
  useEffect(() => {
    if (isOpen) {
      setStep(currentMode === 'admin' ? 1 : 2);
    }
  }, [isOpen, currentMode]);

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
  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  const [startTime, setStartTime] = useState(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
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

  // Search logic
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/users/search?q=${searchQuery}`);
        setSearchResults(data);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculations
  const extrasTotal = useMemo(() => extras.filter(e => e.selected).reduce((acc, curr) => acc + curr.price, 0), [extras]);
  const totalHours = useMemo(() => (days * 24) + hours, [days, hours]);
  const baseCost = useMemo(() => totalHours * ratePerHour, [totalHours, ratePerHour]);
  const totalCost = useMemo(() => baseCost + extrasTotal, [baseCost, extrasTotal]);
  const depositCost = useMemo(() => totalCost * 0.2, [totalCost]);

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

      const isSelf = currentMode === 'user' || (identityMode === 'REGISTERED' && !targetUser);
      const effectiveUserId = isSelf ? user?.id : targetUser?.id;

      const payload = {
        bikeId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        ratePerHour,
        paymentOption,
        extras: extras.filter(e => e.selected).map(e => ({ name: e.name, price: e.price })),
        extrasTotal,
        targetUserId: effectiveUserId,
        clientName: isSelf ? user?.name : (identityMode === 'REGISTERED' ? targetUser?.name : guestName),
        clientPhone: isSelf ? user?.phone : (identityMode === 'REGISTERED' ? targetUser?.phone : guestPhone),
        guestName: identityMode === 'GUEST' ? guestName : null,
        guestDocument: identityMode === 'GUEST' ? guestDoc : null,
        guestPhone: identityMode === 'GUEST' ? guestPhone : null,
      };

      await onConfirm(payload);
      onClose();
    } catch (error) {
      toast.error('Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const minStep = currentMode === 'admin' ? 1 : 2;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      showFooter={false}
      className="max-w-6xl"
    >
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white p-3 rounded-2xl shadow-xl">
              <Bike size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tight">Reservation Wizard</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Create New Rental Session</span>
            </div>
          </div>
          <div className="hidden sm:flex bg-gray-100 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            Step {step} of 4
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => {
            if (currentMode === 'user' && s === 1) return null; // Hide step 1 dot for users
            return (
              <div 
                key={s} 
                className={cn(
                  "h-2 flex-1 rounded-full transition-all duration-500",
                  s <= step ? 'bg-black' : 'bg-gray-100'
                )} 
              />
            )
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        {/* Step 1: Identity (Admin Only) */}
        {step === 1 && currentMode === 'admin' && (
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
            
            <div className="grid grid-cols-2 gap-4 p-2 bg-gray-100 rounded-[2rem]">
              <button 
                onClick={() => setIdentityMode('REGISTERED')}
                className={cn(
                  "flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all text-xs uppercase tracking-widest",
                  identityMode === 'REGISTERED' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Search size={18} /> Registered
              </button>
              <button 
                onClick={() => setIdentityMode('GUEST')}
                className={cn(
                  "flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all text-xs uppercase tracking-widest",
                  identityMode === 'GUEST' ? 'bg-white shadow-md text-black' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <UserPlus size={18} /> New Guest
              </button>
            </div>

            {identityMode === 'REGISTERED' ? (
              <div className="space-y-6">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={24} />
                  <Input 
                    placeholder="Search by name, email or document..." 
                    className="pl-16 h-20 rounded-[1.5rem] bg-gray-50 border-gray-200 focus:bg-white text-xl font-medium transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searching && <div className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-72 overflow-y-auto border-2 border-gray-100 rounded-[2rem] divide-y-2 divide-gray-50 shadow-xl bg-white">
                    {searchResults.map((u) => (
                      <div 
                        key={u.id} 
                        onClick={() => { setTargetUser(u); setSearchResults([]); setSearchQuery(u.name); }}
                        className="p-6 hover:bg-gray-50 cursor-pointer flex justify-between items-center group transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-gray-100 text-gray-500 w-14 h-14 rounded-2xl flex items-center justify-center font-black group-hover:bg-black group-hover:text-white transition-all text-xl">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg">{u.name}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{u.email} • {u.documentNumber}</p>
                          </div>
                        </div>
                        <Plus size={24} className="text-gray-300 group-hover:text-black group-hover:scale-125 transition-all" />
                      </div>
                    ))}
                  </div>
                )}

                {targetUser && (
                  <div className="bg-blue-50 border-2 border-blue-100 p-8 rounded-[2.5rem] flex items-center gap-8 animate-in zoom-in-95 shadow-lg shadow-blue-100">
                    <div className="bg-blue-600 text-white w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-black text-3xl uppercase shadow-xl shadow-blue-200">
                      {targetUser.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Selected Customer</p>
                      <p className="text-2xl font-black text-blue-900 leading-tight">{targetUser.name}</p>
                      <p className="text-sm text-blue-700 font-bold opacity-80 mt-1">{targetUser.documentType}: {targetUser.documentNumber}</p>
                    </div>
                    <div className="bg-blue-200/50 p-3 rounded-2xl text-blue-600 shadow-inner">
                      <ShieldCheck size={32} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                  <Input placeholder="John Doe" className="h-20 rounded-[1.5rem] bg-gray-50 border-gray-200 focus:bg-white text-xl px-8 font-bold" value={guestName} onChange={e => setGuestName(e.target.value)} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Document ID</label>
                  <Input placeholder="ID Number" className="h-20 rounded-[1.5rem] bg-gray-50 border-gray-200 focus:bg-white text-xl px-8 font-bold" value={guestDoc} onChange={e => setGuestDoc(e.target.value)} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Phone Number</label>
                  <Input placeholder="+1 234..." className="h-20 rounded-[1.5rem] bg-gray-50 border-gray-200 focus:bg-white text-xl px-8 font-bold" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Timing & Duration</h3>
                <p className="text-sm text-gray-500 font-medium">Set when the rental starts and for how long</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Start Date</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-20 rounded-[1.5rem] bg-gray-50 border-gray-200 text-xl font-black px-8" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Start Time</label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-20 rounded-[1.5rem] bg-gray-50 border-gray-200 text-xl font-black px-8" />
              </div>
            </div>

            <div className="p-12 bg-gray-50 rounded-[3.5rem] border-2 border-gray-100 shadow-inner">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10 text-center">Rental Duration Selection</p>
              <div className="flex items-center justify-center gap-10">
                <div className="flex flex-col items-center">
                  <Input 
                    type="number" min="0" 
                    value={days} onChange={e => setDays(parseInt(e.target.value) || 0)} 
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] text-center text-5xl font-black border-4 border-white bg-white shadow-2xl focus:ring-black focus:border-black transition-all" 
                  />
                  <p className="text-[10px] font-black text-gray-500 uppercase mt-6 tracking-[0.2em]">Days</p>
                </div>
                <div className="text-5xl font-black text-gray-300 mb-10">:</div>
                <div className="flex flex-col items-center">
                  <Input 
                    type="number" min="0" max="23" 
                    value={hours} onChange={e => setHours(parseInt(e.target.value) || 0)} 
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] text-center text-5xl font-black border-4 border-white bg-white shadow-2xl focus:ring-black focus:border-black transition-all" 
                  />
                  <p className="text-[10px] font-black text-gray-500 uppercase mt-6 tracking-[0.2em]">Hours</p>
                </div>
              </div>
              
              <div className="mt-12 pt-10 border-t-2 border-gray-200/50 flex flex-col items-center">
                <div className="flex items-center gap-3 text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2">
                  <Clock size={16} />
                  <span>Total Billable Time</span>
                </div>
                <div className="text-3xl font-black text-black">
                  {days > 0 && `${days} Day${days > 1 ? 's' : ''} `}
                  {hours > 0 && `${hours} Hour${hours > 1 ? 's' : ''}`}
                  {days === 0 && hours === 0 && '0 Hours'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Extras & Pricing */}
        {step === 3 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Pricing & Add-ons</h3>
                <p className="text-sm text-gray-500 font-medium">Customize rates and include additional services</p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border-2 border-gray-100 shadow-xl shadow-gray-100/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                    {currentMode === 'admin' ? 'Rate per Hour (USD)' : 'Rate Applied'}
                  </label>
                  <p className="text-sm text-gray-500 font-bold">Base rate for this specific rental</p>
                </div>
                <div className="flex items-center gap-6">
                  {currentMode === 'admin' ? (
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">$</span>
                      <Input 
                        type="number" 
                        value={ratePerHour} 
                        onChange={e => setRatePerHour(parseInt(e.target.value) || 0)} 
                        className="h-20 w-40 pl-12 rounded-[1.5rem] bg-gray-50 text-3xl font-black border-none focus:ring-4 focus:ring-black/5 transition-all text-center" 
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">$</span>
                      <Input 
                        type="number" 
                        value={ratePerHour} 
                        readOnly
                        className="h-20 w-40 pl-12 rounded-[1.5rem] bg-gray-50 text-3xl font-black border-none focus:ring-0 transition-all text-center text-gray-500 cursor-not-allowed" 
                      />
                    </div>
                  )}
                  <div className="h-12 w-0.5 bg-gray-100 hidden md:block" />
                  <div className="bg-gray-50 px-8 py-4 rounded-[1.5rem] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Cost</p>
                    <p className="text-2xl font-black text-black">${baseCost.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Optional Extras & Protection</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {extras.map((extra) => (
                  <div 
                    key={extra.id}
                    onClick={() => toggleExtra(extra.id)}
                    className={cn(
                      "group p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col gap-6 relative overflow-hidden",
                      extra.selected 
                        ? 'border-emerald-600 bg-emerald-50 shadow-2xl shadow-emerald-100/50 scale-[1.02]' 
                        : 'border-gray-100 bg-white hover:border-black hover:shadow-xl transition-all'
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                      extra.selected ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-black group-hover:text-white'
                    )}>
                      {extra.selected ? <ShieldCheck size={28} /> : <Plus size={28} />}
                    </div>
                    <div>
                      <p className={cn("font-black text-lg transition-all", extra.selected ? 'text-emerald-900' : 'text-gray-900')}>{extra.name}</p>
                      <p className={cn("text-2xl font-black mt-1", extra.selected ? 'text-emerald-600' : 'text-gray-400 group-hover:text-black')}>+${extra.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Checkout */}
        {step === 4 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Summary & Payment</h3>
                <p className="text-sm text-gray-500 font-medium">Review the final details and select payment method</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-black text-white p-10 rounded-[3.5rem] space-y-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-10%] p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12">
                  <CreditCard size={300} />
                </div>
                
                <div className="space-y-2 relative">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">Estimated Total</p>
                  <p className="text-6xl font-black tracking-tighter leading-none">${totalCost.toFixed(2)}</p>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10 relative">
                  <div className="flex justify-between items-center text-base">
                    <span className="font-bold text-white/40">Base Rental ({totalHours}h)</span>
                    <span className="font-black">${baseCost.toFixed(2)}</span>
                  </div>
                  {extras.filter(e => e.selected).map(e => (
                    <div key={e.id} className="flex justify-between items-center text-base">
                      <span className="font-bold text-white/40">{e.name}</span>
                      <span className="font-black">+${e.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/10 relative space-y-4">
                  {paymentOption === 'DEPOSIT' && (
                    <div className="flex justify-between items-center text-base">
                      <span className="font-bold text-white/40">Security Deposit (20%)</span>
                      <span className="font-black text-emerald-400">${depositCost.toFixed(2)}</span>
                    </div>
                  )}
                  {paymentOption === 'FULL' && (
                    <div className="flex justify-between items-center text-base">
                      <span className="font-bold text-white/40">Amount Due Now</span>
                      <span className="font-black text-emerald-400">${totalCost.toFixed(2)}</span>
                    </div>
                  )}
                  {paymentOption === 'LATER' && (
                    <div className="flex justify-between items-center text-base">
                      <span className="font-bold text-white/40">Pay Now</span>
                      <span className="font-black text-emerald-400">$0.00</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-base pt-4 border-t border-white/10">
                    <span className="font-bold text-white/80">
                      {paymentOption === 'FULL' ? 'Remaining Balance' : 'Remaining at Check-in'}
                    </span>
                    <span className="font-black text-2xl">
                      ${paymentOption === 'FULL' ? '0.00' : paymentOption === 'DEPOSIT' ? (totalCost - depositCost).toFixed(2) : totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Select Payment Strategy</p>
                <div className="space-y-4">
                  {[
                    { id: 'DEPOSIT', title: 'Security Deposit', desc: 'Pay 20% now to confirm', amount: depositCost, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'FULL', title: 'Full Upfront', desc: 'Settle everything today', amount: totalCost, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { id: 'LATER', title: 'Pay at Check-in', desc: '15 min temporary hold', amount: 0, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map((opt: any) => (
                    <div 
                      key={opt.id}
                      onClick={() => setPaymentOption(opt.id as any)}
                      className={cn(
                        "p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex justify-between items-center group",
                        paymentOption === opt.id 
                          ? 'border-black bg-gray-50 shadow-xl scale-[1.02]' 
                          : 'border-gray-100 hover:border-gray-300 bg-white'
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div className={cn("p-4 rounded-2xl transition-all shadow-sm", paymentOption === opt.id ? opt.bg + ' ' + opt.color : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100')}>
                          <opt.icon size={24} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-lg">{opt.title}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider opacity-60">{opt.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-2xl text-gray-900">${opt.amount.toFixed(2)}</p>
                        {paymentOption === opt.id && <div className="h-2 w-full bg-black rounded-full mt-2 animate-in slide-in-from-right-full duration-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {paymentOption === 'LATER' && (
              <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[2.5rem] flex gap-6 items-start animate-in slide-in-from-bottom-4 shadow-lg shadow-amber-100/50">
                <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                  <Info size={32} />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-900 uppercase tracking-[0.2em] mb-2">Temporary Hold Policy</p>
                  <p className="text-base text-amber-800 font-bold leading-relaxed">
                    The bike will be held for exactly <strong className="font-black text-amber-950 underline decoration-amber-300 underline-offset-4">15 minutes</strong>. If not paid or checked-in by then, the system will auto-release the unit.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Unified Action Footer */}
        <div className="flex flex-col sm:flex-row gap-6 w-full mt-12 pt-8 border-t-2 border-gray-50">
          <Button 
            variant="ghost" 
            onClick={step > minStep ? handlePrev : onClose} 
            className="h-20 rounded-[1.5rem] flex-1 font-black gap-3 text-lg hover:bg-gray-100 transition-all uppercase tracking-widest text-gray-400 hover:text-black"
          >
            {step > minStep ? <><ChevronLeft size={24} /> Back</> : 'Cancel'}
          </Button>
          
          {step < 4 ? (
            <Button 
              onClick={handleNext} 
              disabled={(step === 1 && ((identityMode === 'REGISTERED' && !targetUser) || (identityMode === 'GUEST' && (!guestName || !guestDoc))))}
              className="h-20 rounded-[1.5rem] flex-2 font-black bg-black text-white hover:scale-[1.02] active:scale-95 transition-all gap-3 text-lg shadow-2xl shadow-black/20 uppercase tracking-[0.2em]"
            >
              Continue <ChevronRight size={24} />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="h-20 rounded-[1.5rem] flex-2 font-black bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all gap-3 text-lg shadow-2xl shadow-emerald-200 uppercase tracking-[0.2em]"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              ) : (
                <ShieldCheck size={24} />
              )}
              Confirm Reservation
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

// Helper for missing Zap icon
const Zap = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} 
    viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" 
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
    className={className}
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
