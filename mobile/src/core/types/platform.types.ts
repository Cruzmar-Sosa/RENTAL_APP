export type AppLifecycleState = 'active' | 'background' | 'inactive';

export type NetworkConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown';

export interface DeviceInfo {
  readonly brand: string;
  readonly modelName: string;
  readonly osName: string;
  readonly osVersion: string;
  readonly batteryLevel: number;
  readonly isCharging: boolean;
  readonly uniqueDeviceId: string;
}
