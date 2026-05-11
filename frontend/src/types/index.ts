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
  // Legacy field (kept for compatibility)
  status: 'AVAILABLE' | 'RESERVED' | 'IN_USE' | 'MAINTENANCE';
  // Dual-domain state model (authoritative)
  operationalStatus: 'AVAILABLE' | 'RESERVED' | 'CHECKED_IN' | 'IN_USE';
  technicalStatus: 'OK' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  imageUrl?: string | null;
  imageKey?: string | null;
  stationId: string;
  station?: Station;
}

export type ReservationStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'CHECKED_IN' 
  | 'ACTIVE' 
  | 'COMPLETED' 
  | 'SETTLEMENT_PENDING' 
  | 'SETTLED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type ReservationFinancialStatus = 
  | 'PENDING' 
  | 'PARTIALLY_PAID' 
  | 'PAID' 
  | 'REFUNDED' 
  | 'FAILED';

export interface Reservation {
  id: string;
  userId: string;
  bikeId: string;
  status: ReservationStatus;
  financialStatus: ReservationFinancialStatus;
  startTime: string;
  endTime?: string;
  actualStart?: string;
  actualEnd?: string;
  checkInAt?: string;
  settledAt?: string;
  settlementReference?: string;
  expiresAt?: string;
  priceEstimated?: number;
  priceActual?: number;
  // Pricing
  ratePerHour?: number;
  // Client / Guest snapshot
  clientName?: string;
  clientPhone?: string;
  guestName?: string;
  guestDocument?: string;
  guestPhone?: string;
  // Extras
  extras?: { name: string; price: number }[];
  extrasTotal?: number;
  // Check-in
  bikeCondition?: string;
  bikeNotes?: string;
  termsAccepted?: boolean;
  // Settlement
  incidentType?: string;
  incidentCategory?: string;
  incidentNotes?: string;
  incidentReportedAt?: string;
  incidentReportedById?: string;
  incidentReportedBy?: Pick<User, 'email' | 'name'>;
  // Relations
  user?: Pick<User, 'id' | 'email' | 'name' | 'phone' | 'documentType' | 'documentNumber'>;
  bike?: Bike;
  payments?: Payment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  type: 'UPFRONT' | 'DEPOSIT' | 'POST_RIDE' | 'BALANCE' | 'REFUND';
  stripePaymentIntentId?: string;
  paidAt?: string;
  createdAt: string;
  reservation?: Reservation;
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
