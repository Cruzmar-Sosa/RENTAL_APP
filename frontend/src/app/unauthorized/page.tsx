'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <ShieldAlert size={40} strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Access Denied
          </h1>
          <p className="text-gray-500">
            You do not have permission to view this page. If you believe this is an error, please contact support.
          </p>
        </div>

        <Link 
          href="/dashboard"
          className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 mt-4 text-sm font-medium text-white transition-all bg-black rounded-xl hover:bg-gray-800 hover:shadow-lg hover:shadow-black/10 focus:ring-2 focus:ring-black/20"
        >
          <ArrowLeft size={18} />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
