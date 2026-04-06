import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * useAuth ensures that the user is authenticated.
 * It checks for the existence of a token, decodes it, and redirects to login if invalid.
 */
export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<{ sub: string, email: string, role: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      } else {
        const decoded = decodeJwt(token);
        if (decoded && decoded.role) {
          setUser(decoded);
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      }
    }
  }, [router]);

  return { user };
}
