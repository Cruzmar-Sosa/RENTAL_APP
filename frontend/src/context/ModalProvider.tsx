"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ModalType =
  | 'RESERVATION_WIZARD'
  | 'CHECK_IN'
  | 'SETTLEMENT'
  | 'PAYMENT_REVIEW'
  | 'RESERVATION_DETAIL'
  | 'CHECKOUT'
  | 'PIN_ENTRY';

interface ModalStore {
  type: ModalType | null;
  data: any;
  isOpen: boolean;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalStore | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [type, setType] = useState<ModalType | null>(null);
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback((modalType: ModalType, modalData: any = null) => {
    setType(modalType);
    setData(modalData);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // We delay clearing the type/data to allow for smooth exit animations if any
    setTimeout(() => {
      setType(null);
      setData(null);
    }, 300);
  }, []);

  return (
    <ModalContext.Provider value={{ type, data, isOpen, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
