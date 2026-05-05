"use client";

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
  cancelText?: string;
}

export function BaseModal({
  isOpen,
  onClose,
  children,
  className,
  showFooter = true,
  cancelText = "Cancel"
}: BaseModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Lock scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      <div
        className={cn(
          `
          relative
          w-[95%]
          sm:max-w-[700px]
          md:max-w-[900px]
          lg:max-w-[1100px]
          max-h-[90vh]
          overflow-hidden
          rounded-[2rem]
          bg-white
          shadow-2xl
          flex flex-col
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
          `,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON (X) */}
        <button
          className="
            absolute top-6 right-6 
            z-50
            w-10 h-10 
            flex items-center justify-center 
            rounded-full 
            bg-gray-100 hover:bg-black 
            text-gray-500 hover:text-white 
            transition-all duration-200
            hover:rotate-90
          "
          onClick={onClose}
          aria-label="Close modal"
        >
          <span className="text-xl leading-none">✕</span>
        </button>

        {/* CONTENT CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {children}
        </div>

        {/* FOOTER */}
        {showFooter && (
          <div className="flex justify-end p-6 sm:px-10 sm:pb-10 pt-4 gap-3 bg-gray-50/50 border-t border-gray-100">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-black hover:bg-gray-100 transition-all"
            >
              {cancelText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
