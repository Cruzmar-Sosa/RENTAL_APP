export class CreateLocationDto {
  bikeId!: string;
  latitude!: number;
  longitude!: number;
  speed?: number;
  frameId?: string;
  rideId?: string;
  deviceId?: string;
  heading?: number;
  batteryLevel?: number;
  timestamp?: string;
}
