export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  code: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface Station {
  id: string;
  code: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  bikes: Bike[];
}

export interface Bike {
  id: string;
  code: number;
  status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE';
  stationId: string;
  station?: Station;
}

export interface Reservation {
  id: string;
  userId: string;
  bikeId: string;
  status: 'ACTIVE' | 'COMPLETED';
  startTime: string;
  endTime?: string;
  user?: Pick<User, 'id' | 'email' | 'name'>;
  bike?: Bike;
}
