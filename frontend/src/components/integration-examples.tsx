'use client';

import React from 'react';
import { useCheckInFlow } from '@/hooks/usePaymentAndPin';
import { CreditCard, Lock } from 'lucide-react';

/**
 * Example: Booking Page Integration
 * Shows how to integrate checkout modal for payment
 */
export function BookingPageExample() {
  const { showCheckout } = useCheckInFlow();

  const mockBike = {
    id: 'bike-123',
    model: 'Trek Mountain Bike',
    code: 1234,
    imageKey: 'bike-1234.jpg',
  };

  const mockReservation = {
    id: 'res-456',
    estimatedDuration: 120, // minutes
    depositRequired: true,
    estimatedCost: 25.00,
  };

  const handleBookBike = () => {
    showCheckout(mockBike, mockReservation);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Book Your Bike</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{mockBike.model}</h2>
        <p className="text-gray-600 mb-2">Bike Code: #{mockBike.code}</p>
        <p className="text-gray-600 mb-4">Estimated Duration: {Math.ceil(mockReservation.estimatedDuration / 60)} hours</p>
        <p className="text-2xl font-bold text-blue-600 mb-6">${mockReservation.estimatedCost.toFixed(2)}</p>
        
        <button
          onClick={handleBookBike}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

/**
 * Example: Check-in Page Integration
 * Shows how to integrate PIN entry modal for unlock
 */
export function CheckInPageExample() {
  const { startCheckIn } = useCheckInFlow();

  const mockReservation = {
    id: 'res-456',
    bike: { model: 'Trek Mountain Bike', code: 1234 },
    status: 'CONFIRMED',
  };

  const handleUnlockBike = () => {
    startCheckIn(mockReservation.id);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Check In</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{mockReservation.bike.model}</h2>
        <p className="text-gray-600 mb-4">Bike Code: #{mockReservation.bike.code}</p>
        <p className="text-green-600 font-semibold mb-6">✓ Payment Confirmed</p>
        
        <button
          onClick={handleUnlockBike}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
        >
          <Lock className="w-5 h-5" />
          Unlock Bike
        </button>
      </div>
    </div>
  );
}
