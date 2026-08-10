import { create } from 'zustand';
import { Reservation } from '@domain/entities/Reservation';
import { Nullable } from '@core/types';

export interface ReservationState {
  activeReservation: Nullable<Reservation>;
  setActiveReservation: (reservation: Nullable<Reservation>) => void;
  clearActiveReservation: () => void;
}

export const useReservationStore = create<ReservationState>((set) => ({
  activeReservation: null,
  setActiveReservation: (reservation) => set({ activeReservation: reservation }),
  clearActiveReservation: () => set({ activeReservation: null }),
}));
