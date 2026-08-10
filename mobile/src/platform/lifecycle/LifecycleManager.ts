import { AppState, AppStateStatus } from 'react-native';
import { ILifecycleManager, LifecycleListener } from './ILifecycleManager';
import { AppLifecycleState } from '@core/types';

export class LifecycleManager implements ILifecycleManager {
  private mapState(status: AppStateStatus): AppLifecycleState {
    if (status === 'active') return 'active';
    if (status === 'background') return 'background';
    return 'inactive';
  }

  public getCurrentState(): AppLifecycleState {
    return this.mapState(AppState.currentState);
  }

  public onForeground(callback: () => void): () => void {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        callback();
      }
    });
    return () => subscription.remove();
  }

  public onBackground(callback: () => void): () => void {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        callback();
      }
    });
    return () => subscription.remove();
  }

  public onChange(callback: LifecycleListener): () => void {
    const subscription = AppState.addEventListener('change', (nextState) => {
      callback(this.mapState(nextState));
    });
    return () => subscription.remove();
  }
}
