'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { LogOut, ArrowLeft, ShieldCheck, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useSafeNavigation } from '@/hooks/useSafeNavigation';

export function Header({ title = 'eTours León' }: { title?: string }) {
  const { user, logout } = useAuthStore();
  const { goBackSafe } = useSafeNavigation();

  if (!user) return null;

  return (
    <header className="h-20 bg-white border-b flex items-center justify-between px-8 z-30 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={goBackSafe}
          className="p-2 border rounded-xl hover:bg-gray-50 transition-colors text-gray-500"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-gray-300 font-light text-2xl">|</span>
        <h2 className="font-bold text-lg">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-bold text-sm leading-tight">{user.name || user.email.split('@')[0]}</div>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className={cn(
                "text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md",
                user.role === 'ADMIN' ? "bg-black text-white" : "bg-blue-50 text-blue-600"
              )}>
                {user.role}
              </span>
            </div>
          </div>
          <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
            {user.role === 'ADMIN' ? <ShieldCheck size={20} /> : <UserIcon size={20} />}
          </div>
        </div>
        <div className="h-8 w-px bg-gray-100" />
        <button 
          onClick={logout}
          className="text-sm font-bold text-gray-400 hover:text-red-500 flex items-center gap-2 transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
}
