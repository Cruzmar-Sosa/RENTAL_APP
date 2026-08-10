import * as Network from 'expo-network';
import { IConnectivityManager } from './IConnectivityManager';
import { NetworkConnectionType } from '@core/types';

export class ConnectivityManager implements IConnectivityManager {
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  public async isOnline(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      return Boolean(state.isConnected && state.isInternetReachable);
    } catch {
      return false;
    }
  }

  public async getConnectionType(): Promise<NetworkConnectionType> {
    try {
      const state = await Network.getNetworkStateAsync();
      if (state.type === Network.NetworkStateType.WIFI) return 'wifi';
      if (state.type === Network.NetworkStateType.CELLULAR) return 'cellular';
      if (state.type === Network.NetworkStateType.NONE) return 'none';
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  public onReconnect(callback: () => void): () => void {
    const listener = (online: boolean) => {
      if (online) callback();
    };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onDisconnect(callback: () => void): () => void {
    const listener = (online: boolean) => {
      if (!online) callback();
    };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
