export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  code: number;
  email: string;
  name: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  role: UserRole;
}


export interface Station {
  id: string;
  code: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  bikes: Bike[];
}

export interface Bike {
  id: string;
  code: number;
  model?: string;
  batteryLevel?: number;
  status: 'AVAILABLE' | 'RESERVED' | 'IN_USE' | 'MAINTENANCE';
  stationId: string;
  station?: Station;
}

export interface Reservation {
  id: string;
  userId: string;
  bikeId: string;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  startTime: string;
  endTime?: string;
  actualStart?: string;
  actualEnd?: string;
  priceEstimated?: number;
  priceActual?: number;
  user?: Pick<User, 'id' | 'email' | 'name' | 'documentType' | 'documentNumber'>;
  bike?: Bike;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  reservationId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  type: 'UPFRONT' | 'DEPOSIT' | 'POST_RIDE';
  stripePaymentIntentId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  difficulty: 'EASY' | 'MODERATE' | 'HARD';
  distanceKm: number;
  durationMin: number;
  polyline?: any;
  pois?: POI[];
}

export interface POI {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  routeId: string;
}

export interface BikeLocation {
  id: string;
  bikeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}
