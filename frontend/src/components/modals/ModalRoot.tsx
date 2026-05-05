"use client";

import React from 'react';
import { useModal } from '@/context/ModalProvider';
import { ReserveModal } from './ReserveModal';
import { CheckInModal } from './CheckInModal';
import { SettlementModal } from './SettlementModal';
import { PaymentModal } from './PaymentModal';
import { ReservationDetailModal } from './ReservationDetailModal';

export function ModalRoot() {
  const { type, data, isOpen, closeModal } = useModal();

  if (!isOpen || !type) return null;

  const renderModal = () => {
    switch (type) {
      case 'RESERVATION_WIZARD':
        return (
          <ReserveModal 
            isOpen={isOpen} 
            onClose={closeModal} 
            bikeId={data?.bikeId} 
            user={data?.user}
            onConfirm={data?.onConfirm}
          />
        );
      case 'CHECK_IN':
        return (
          <CheckInModal 
            isOpen={isOpen} 
            onClose={closeModal} 
            reservation={data?.reservation}
            onConfirm={data?.onConfirm}
          />
        );
      case 'SETTLEMENT':
        return (
          <SettlementModal 
            isOpen={isOpen} 
            onClose={closeModal} 
            reservation={data?.reservation}
            onConfirm={data?.onConfirm}
          />
        );
      case 'PAYMENT_REVIEW':
        return (
          <PaymentModal 
            isOpen={isOpen} 
            onClose={closeModal} 
            payment={data?.payment}
            onConfirm={data?.onConfirm}
          />
        );
      case 'RESERVATION_DETAIL':
        return (
          <ReservationDetailModal 
            isOpen={isOpen} 
            onClose={closeModal} 
            reservationId={data?.reservationId}
          />
        );
      default:
        return null;
    }
  };

  return renderModal();
}
