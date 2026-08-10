import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import { IDeviceManager } from './IDeviceManager';
import { DeviceInfo } from '@core/types';

export class DeviceManager implements IDeviceManager {
  public async getBatteryLevel(): Promise<number> {
    try {
      const level = await Battery.getBatteryLevelAsync();
      if (level === -1) return 100;
      return Math.round(level * 100);
    } catch {
      return 100;
    }
  }

  public async getDeviceId(): Promise<string> {
    return Device.osInternalBuildId || Device.modelName || 'unknown_device_id';
  }

  public async getDeviceInfo(): Promise<DeviceInfo> {
    const batteryLevel = await this.getBatteryLevel();
    const batteryState = await Battery.getBatteryStateAsync().catch(() => Battery.BatteryState.UNKNOWN);
    const isCharging = batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL;
    const uniqueDeviceId = await this.getDeviceId();

    return {
      brand: Device.brand || 'UnknownBrand',
      modelName: Device.modelName || 'UnknownModel',
      osName: Device.osName || 'UnknownOS',
      osVersion: Device.osVersion || '0.0.0',
      batteryLevel,
      isCharging,
      uniqueDeviceId,
    };
  }
}
