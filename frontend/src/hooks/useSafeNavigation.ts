'use client';

import { useRouter, usePathname } from 'next/navigation';

export function useSafeNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const goBackSafe = () => {
    // Top boundary protection
    if (pathname === '/dashboard') return;

    if (typeof document !== 'undefined') {
      if (document.referrer.includes('/login')) {
        router.push('/dashboard');
      } else {
        router.back();
      }
    } else {
      router.push('/dashboard');
    }
  };

  return { goBackSafe };
}
