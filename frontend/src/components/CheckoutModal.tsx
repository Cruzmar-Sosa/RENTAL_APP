'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, X, AlertCircle } from 'lucide-react';
import { PaymentForm, PaymentDetails } from './PaymentForm';

interface CheckoutModalProps {
  isOpen: boolean;
  bike: {
    id: string;
    model: string;
    code: number;
    imageKey?: string;
  };
  reservationDetails: {
    id: string;
    estimatedDuration: number; // in minutes
    depositRequired: boolean;
    estimatedCost: number;
  };
  isLoading?: boolean;
  error?: string | null;
  onConfirm: (paymentDetails: PaymentDetails) => Promise<void>;
  onCancel?: () => void;
}

/**
 * CheckoutModal Component
 * Shows bike/deposit/duration preview with payment form
 */
export function CheckoutModal({
  isOpen,
  bike,
  reservationDetails,
  isLoading = false,
  error = null,
  onConfirm,
  onCancel,
}: CheckoutModalProps) {
  const [step, setStep] = useState<'review' | 'payment'>('review');

  const handleContinueToPayment = () => {
    setStep('payment');
  };

  const handleBackToReview = () => {
    setStep('review');
  };

  const handleCancel = () => {
    setStep('review');
    onCancel?.();
  };

  const depositAmount = reservationDetails.depositRequired ? reservationDetails.estimatedCost * 0.2 : 0;
  const finalCost = reservationDetails.estimatedCost;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Checkout
          </h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-blue-500 rounded transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-80">
          {step === 'review' ? (
            // Review Step
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Bike Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Bike Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-semibold text-gray-900">{bike.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bike Code:</span>
                    <span className="font-semibold text-gray-900">#{bike.code}</span>
                  </div>
                </div>
              </div>

              {/* Reservation Details */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Reservation Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Duration:</span>
                    <span className="font-semibold text-gray-900">
                      {Math.ceil(reservationDetails.estimatedDuration / 60)} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Rate:</span>
                    <span className="font-semibold text-gray-900">
                      ${(finalCost / (Math.ceil(reservationDetails.estimatedDuration / 60) || 1)).toFixed(2)}/hr
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Rental Cost:</span>
                    <span className="font-semibold text-gray-900">${finalCost.toFixed(2)}</span>
                  </div>
                  {reservationDetails.depositRequired && (
                    <>
                      <div className="flex justify-between text-blue-600">
                        <span>Deposit (20%):</span>
                        <span className="font-semibold">${depositAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-blue-200 pt-2 flex justify-between">
                        <span className="text-lg font-bold text-blue-900">
                          Charge Today:
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          ${depositAmount.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        ℹ️ Remaining ${(finalCost - depositAmount).toFixed(2)} will be charged after your ride
                      </p>
                    </>
                  )}
                  {!reservationDetails.depositRequired && (
                    <div className="border-t border-blue-200 pt-2 flex justify-between">
                      <span className="text-lg font-bold text-blue-900">Total:</span>
                      <span className="text-xl font-bold text-blue-600">
                        ${finalCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinueToPayment}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                >
                  Continue to Payment
                </button>
              </div>
            </motion.div>
          ) : (
            // Payment Step
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <button
                  onClick={handleBackToReview}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50 mb-4"
                >
                  ← Back to Review
                </button>
              </div>

              <PaymentForm
                amount={depositAmount || finalCost}
                reservationId={reservationDetails.id}
                depositAmount={reservationDetails.depositRequired ? depositAmount : undefined}
                isLoading={isLoading}
                onSubmit={onConfirm}
                onCancel={handleBackToReview}
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
