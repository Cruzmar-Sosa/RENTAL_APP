'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Lock } from 'lucide-react';

interface PinEntryModalProps {
  isOpen: boolean;
  reservationId: string;
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (pin: string) => Promise<void>;
  onCancel?: () => void;
  onResendPin?: () => Promise<void>;
}

/**
 * PinEntryModal Component
 * Numeric keypad for PIN entry with masking
 */
export function PinEntryModal({
  isOpen,
  reservationId,
  isLoading = false,
  error = null,
  onSubmit,
  onCancel,
  onResendPin,
}: PinEntryModalProps) {
  const [pin, setPin] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const PIN_LENGTH = 4;

  const handleNumpadClick = (digit: string) => {
    if (pin.length < PIN_LENGTH) {
      setPin(pin + digit);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== PIN_LENGTH) return;

    setSubmitted(true);
    try {
      await onSubmit(pin);
    } finally {
      setSubmitted(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    onCancel?.();
  };

  const handleResend = async () => {
    setPin('');
    onResendPin?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 p-4 rounded-full">
                    <Lock className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Your PIN</h2>
                <p className="text-gray-600">Check your SMS for the 4-digit code</p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* PIN Display */}
              <div className="mb-8">
                <div className="flex justify-center gap-3">
                  {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{
                        scale: pin.length > i ? 1.1 : 1,
                      }}
                      className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition ${
                        pin.length > i
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 bg-gray-50 text-gray-300'
                      }`}
                    >
                      {pin.length > i ? '●' : '○'}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* 0-8 */}
                {Array.from({ length: 9 }, (_, i) => i + 1).map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleNumpadClick(digit.toString())}
                    disabled={pin.length >= PIN_LENGTH || isLoading || submitted}
                    className="py-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {digit}
                  </button>
                ))}

                {/* First row: 0 is wide, delete is on second row */}
              </div>

              {/* Bottom row: 0 (wide), Delete */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Empty */}
                <div />
                
                {/* 0 */}
                <button
                  onClick={() => handleNumpadClick('0')}
                  disabled={pin.length >= PIN_LENGTH || isLoading || submitted}
                  className="py-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  0
                </button>

                {/* Delete */}
                <button
                  onClick={handleDelete}
                  disabled={pin.length === 0 || isLoading || submitted}
                  className="py-4 bg-red-100 hover:bg-red-200 rounded-lg font-bold text-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Del
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isLoading || submitted}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={pin.length !== PIN_LENGTH || isLoading || submitted}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                >
                  {submitted ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Verifying...
                    </span>
                  ) : (
                    'Unlock'
                  )}
                </button>
              </div>

              {/* Resend PIN Link */}
              {onResendPin && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleResend}
                    disabled={isLoading || submitted}
                    className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                  >
                    Didn't receive the PIN? Resend
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
