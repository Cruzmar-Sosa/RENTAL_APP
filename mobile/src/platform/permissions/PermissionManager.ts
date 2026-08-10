import * as Location from 'expo-location';
import { IPermissionManager, PermissionStatus } from './IPermissionManager';

export class PermissionManager implements IPermissionManager {
  private mapPermissionStatus(status: Location.PermissionStatus): PermissionStatus {
    if (status === Location.PermissionStatus.GRANTED) return 'granted';
    if (status === Location.PermissionStatus.DENIED) return 'denied';
    return 'undetermined';
  }

  public async requestLocation(): Promise<PermissionStatus> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return this.mapPermissionStatus(status);
    } catch {
      return 'denied';
    }
  }

  public async requestBackgroundLocation(): Promise<PermissionStatus> {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      return this.mapPermissionStatus(status);
    } catch {
      return 'denied';
    }
  }

  public async requestNotifications(): Promise<PermissionStatus> {
    // Basic notification permission stub until expo-notifications is added
    return 'granted';
  }

  public async requestCamera(): Promise<PermissionStatus> {
    // Basic camera permission stub until expo-camera is added
    return 'granted';
  }

  public async requestBluetooth(): Promise<PermissionStatus> {
    return 'granted';
  }

  public async checkLocationPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return this.mapPermissionStatus(status);
    } catch {
      return 'undetermined';
    }
  }
}
