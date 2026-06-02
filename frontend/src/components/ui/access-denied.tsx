'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AccessDenied() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/unauthorized');
  }, [router]);

  return null;
}
