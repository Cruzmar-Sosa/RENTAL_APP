'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Bike } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, isLoaded } = useAuthStore();
  const queryClient = useQueryClient();

  // N1 Fix: Go Back Button Security Issue - Bouncing Back
  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoaded, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      localStorage.clear();
      queryClient.clear();

      const res = await api.post('/auth/login', { email, password });

      // login() is now async — it calls /auth/me and normalizes permissions
      // BEFORE setting isLoaded:true, so sidebar renders complete on first mount
      await login(res.data.access_token, res.data.user);

      toast.success('Welcome back to eTours León! 🚲');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-black/3 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/2 rounded-full blur-3xl" />

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-[1.5rem] mb-6 shadow-2xl shadow-black/20">
            <Bike className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-black">eTours León</h1>
          <p className="text-gray-400 font-medium mt-2">Bike rental platform for exploring León</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
              <input 
                className="w-full bg-white border border-gray-100 p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-black/5 focus:border-black/10 transition-all text-black font-medium" 
                placeholder="admin@etours.com" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
              <input 
                className="w-full bg-white border border-gray-100 p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-black/5 focus:border-black/10 transition-all text-black font-medium" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-black text-white p-4 rounded-2xl font-bold mt-4 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-xl shadow-black/10 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-8">
          Don&apos;t have an account? <button className="text-black font-bold hover:underline">Contact Admin</button>
        </p>
      </div>
    </div>
  );
}
