import { AppLifecycleState } from '@core/types';

export type LifecycleListener = (state: AppLifecycleState) => void;

export interface ILifecycleManager {
  getCurrentState(): AppLifecycleState;
  onForeground(callback: () => void): () => void;
  onBackground(callback: () => void): () => void;
  onChange(callback: LifecycleListener): () => void;
}
