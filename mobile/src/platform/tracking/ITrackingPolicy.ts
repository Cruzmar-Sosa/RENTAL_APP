export interface TrackingPolicyParams {
  batteryLevelPercent: number;
  isMoving: boolean;
  isForeground: boolean;
}

export interface ITrackingPolicy {
  getSamplingIntervalMs(params: TrackingPolicyParams): number;
}
