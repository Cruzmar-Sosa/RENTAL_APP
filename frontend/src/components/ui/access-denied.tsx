'use client';

import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
      <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-red-100 rounded-[2rem] blur-xl opacity-50" />
        <ShieldAlert className="text-red-500 w-12 h-12 relative z-10" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Access Restricted</h1>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto font-medium">
          You don't have the required security clearance to view this module.
        </p>
      </div>
      <button 
        onClick={() => router.push('/dashboard')}
        className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition shadow-lg shadow-black/10"
      >
        Return to Safe Zone
      </button>
    </div>
  );
}
