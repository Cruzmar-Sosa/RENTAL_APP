import { ITrackingPolicy, TrackingPolicyParams } from './ITrackingPolicy';
import { CORE_CONSTANTS } from '@core/config';

export class AdaptivePolicy implements ITrackingPolicy {
  public getSamplingIntervalMs(params: TrackingPolicyParams): number {
    if (params.batteryLevelPercent <= CORE_CONSTANTS.LOW_BATTERY_THRESHOLD_PERCENT) {
      return CORE_CONSTANTS.GPS_INTERVAL_LOW_BATTERY_MS;
    }
    if (!params.isMoving) {
      return CORE_CONSTANTS.GPS_INTERVAL_IDLE_MS;
    }
    return CORE_CONSTANTS.GPS_INTERVAL_ACTIVE_MS;
  }
}
