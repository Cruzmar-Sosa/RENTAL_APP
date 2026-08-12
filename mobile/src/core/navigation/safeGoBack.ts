import { Router } from 'expo-router';

export function safeGoBack(router: Router, fallbackPath: string = '/(app)/map'): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackPath as any);
  }
}
