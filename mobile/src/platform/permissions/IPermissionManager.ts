export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface IPermissionManager {
  requestLocation(): Promise<PermissionStatus>;
  requestBackgroundLocation(): Promise<PermissionStatus>;
  requestNotifications(): Promise<PermissionStatus>;
  requestCamera(): Promise<PermissionStatus>;
  requestBluetooth(): Promise<PermissionStatus>;
  checkLocationPermission(): Promise<PermissionStatus>;
}
