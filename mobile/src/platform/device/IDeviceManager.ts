import { DeviceInfo } from '@core/types';

export interface IDeviceManager {
  getDeviceInfo(): Promise<DeviceInfo>;
  getBatteryLevel(): Promise<number>;
  getDeviceId(): Promise<string>;
}
