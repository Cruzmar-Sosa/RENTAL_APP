import { Station } from '../entities/Station';

export interface IStationRepository {
  getAllStations(): Promise<readonly Station[]>;
  getStationById(id: string): Promise<Station>;
}
