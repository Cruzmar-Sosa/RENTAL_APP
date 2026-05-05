"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface AppModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: ModalSize
  className?: string
  contentClassName?: string
  headerClassName?: string
  footerClassName?: string
  stickyHeader?: boolean
  stickyFooter?: boolean
  // Allow closing on backdrop click? Default false based on requirements
  closeOnOutsideClick?: boolean
}

const sizeMap: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-6xl sm:w-[90vw]'
}

export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  stickyHeader = true,
  stickyFooter = true,
  closeOnOutsideClick = false
}: AppModalProps) {
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open, eventDetails) => {
        // Prevent closing on outside interaction if requested
        if (!open && (eventDetails as any)?.reason === 'interact-outside' && !closeOnOutsideClick) {
          (eventDetails as any).cancel();
          return;
        }
        if (!open) onClose();
      }}
    >
      <DialogContent 
        className={cn(
          // Base styles
          "p-0 overflow-hidden flex flex-col gap-0 !max-w-none", // Reset default max-w
          // Responsive sizing
          "w-full h-[100dvh] sm:h-auto sm:max-h-[90vh]",
          // Size map
          sizeMap[size],
          // Transitions and appearance
          "sm:rounded-[2rem] border-0 shadow-2xl bg-white",
          "data-open:animate-in data-closed:animate-out",
          "data-open:fade-in-0 data-closed:fade-out-0",
          "data-open:zoom-in-95 data-closed:zoom-out-95",
          "duration-200",
          className
        )}
      >
        {title && (
          <DialogHeader className={cn(
            "p-6 sm:p-8 border-b shrink-0",
            stickyHeader && "sticky top-0 z-20 bg-white/80 backdrop-blur-md",
            headerClassName
          )}>
            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight">
              {typeof title === 'string' ? title : (
                <div className="flex items-center gap-4">
                  <span className="sr-only">Modal Title</span>
                  {title}
                </div>
              )}
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-1 text-sm sm:text-base text-muted-foreground font-medium">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        
        <div className={cn(
          "flex-1 overflow-y-auto p-6 sm:p-8",
          "scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent",
          contentClassName
        )}>
          {children}
        </div>

        {footer && (
          <div className={cn(
            "p-6 sm:p-8 border-t shrink-0 bg-white",
            stickyFooter && "sticky bottom-0 z-20",
            footerClassName
          )}>
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
