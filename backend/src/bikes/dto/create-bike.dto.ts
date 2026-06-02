export class CreateBikeDto {
  stationId!: string;
  status?: string;
  model?: string;
  batteryLevel?: number;
  imageUrl?: string;
  imageKey?: string;
}
