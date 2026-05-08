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
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300 p-4 sm:p-6"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className={cn(
          `
          relative
          w-full
          sm:max-w-[700px]
          md:max-w-[900px]
          lg:max-w-[1100px]
          max-h-[95vh]
          sm:max-h-[90vh]
          overflow-hidden
          rounded-[2.5rem]
          bg-white
          shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]
          flex flex-col
          animate-in zoom-in-95 slide-in-from-bottom-8 duration-500
          `,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON (X) */}
        <button
          className="
            absolute top-6 right-6 
            z-110
            w-12 h-12 
            flex items-center justify-center 
            rounded-2xl
            bg-gray-50 hover:bg-black 
            text-gray-400 hover:text-white 
            transition-all duration-300
            hover:rotate-90
            shadow-sm hover:shadow-xl
          "
          onClick={onClose}
          aria-label="Close modal"
        >
          <span className="text-xl font-light">✕</span>
        </button>

        {/* CONTENT CONTAINER */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-12 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </div>

        {/* FOOTER - Optional via showFooter */}
        {showFooter && (
          <div className="flex flex-col sm:flex-row justify-end p-6 sm:px-12 sm:pb-12 pt-6 gap-4 bg-gray-50/80 backdrop-blur-sm border-t border-gray-100 mt-auto">
            <button 
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-black hover:bg-white transition-all shadow-sm hover:shadow-md border border-transparent hover:border-gray-200"
            >
              {cancelText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
