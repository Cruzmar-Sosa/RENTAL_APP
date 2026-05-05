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
  sm: 'sm:max-w-[95%] md:max-w-[400px]',
  md: 'sm:max-w-[95%] md:max-w-[700px]',
  lg: 'sm:max-w-[95%] md:max-w-[900px]',
  xl: 'sm:max-w-[95%] md:max-w-[1100px]',
  full: 'sm:max-w-[98%] md:max-w-[1400px]'
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
  // Use a ref to track if the modal is currently closing to prevent flicker
  const isClosing = React.useRef(false);

  const handleOpenChange = (open: boolean, event?: any, reason?: string) => {
    if (isClosing.current) return;

    // Prevent closing if outside interaction is disabled
    if (!open && reason === 'outside-click' && !closeOnOutsideClick) {
      return;
    }

    if (!open) {
      isClosing.current = true;
      onClose();
      // Reset after a short delay to allow state updates to propagate
      setTimeout(() => {
        isClosing.current = false;
      }, 300);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
    >
      <DialogContent 
        className={cn(
          // Base styles
          "p-0 overflow-hidden flex flex-col gap-0 max-w-none!", // Reset default max-w
          // Responsive sizing: 95% width on mobile, auto height
          "w-[95%] h-auto max-h-[95vh] sm:h-auto sm:max-h-[90vh]",
          // Size map for desktop
          sizeMap[size],
          // Centered positioning (Radix handles this, but we reinforce)
          "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
          // Transitions and appearance
          "rounded-[1.5rem] sm:rounded-[2rem] border-0 shadow-2xl bg-white",
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
