'use client';

import { Loader2 } from 'lucide-react';

export function LoadingScreen({ message = 'Verifying secure connection...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-4 bg-white rounded-2xl shadow-xl shadow-black/5 animate-pulse">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
      <p className="text-sm font-bold text-gray-400 tracking-widest uppercase animate-pulse">
        {message}
      </p>
    </div>
  );
}
