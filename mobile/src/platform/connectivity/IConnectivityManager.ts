import { NetworkConnectionType } from '@core/types';

export type ConnectionListener = (isOnline: boolean) => void;

export interface IConnectivityManager {
  isOnline(): Promise<boolean>;
  getConnectionType(): Promise<NetworkConnectionType>;
  onReconnect(callback: () => void): () => void;
  onDisconnect(callback: () => void): () => void;
}
