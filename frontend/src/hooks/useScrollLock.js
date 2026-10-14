import { useEffect } from 'react';

let lockCount = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';

/**
 * Resets any active scroll locks and clears any pointer-events blocking.
 * Safe to call on route changes or unexpected unmounts.
 */
export function resetScrollLock() {
  lockCount = 0;
  if (typeof document !== 'undefined') {
    document.body.style.overflow = originalBodyOverflow || '';
    document.body.style.paddingRight = originalBodyPaddingRight || '';
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.style.pointerEvents = '';
    }
  }
}

/**
 * Locks the scroll on the body when a modal is open.
 * Adds padding to prevent layout shift caused by the disappearing scrollbar.
 * Uses a reference counter so nested modals/dialogs do not corrupt the scroll/pointer state.
 */
export function useScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    if (lockCount === 0) {
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const originalStyle = window.getComputedStyle(document.body);
      originalBodyPaddingRight = originalStyle.paddingRight;
      originalBodyOverflow = originalStyle.overflow === 'hidden' ? '' : originalStyle.overflow;

      // Lock body scroll and add padding to prevent layout shift
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `calc(${originalBodyPaddingRight} + ${scrollbarWidth}px)`;
      }
    }

    // Always ensure main-scroll-container remains fully interactive
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer && mainContainer.style.pointerEvents === 'none') {
      mainContainer.style.pointerEvents = '';
    }

    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        document.body.style.overflow = originalBodyOverflow || '';
        document.body.style.paddingRight = originalBodyPaddingRight || '';

        const container = document.getElementById('main-scroll-container');
        if (container) {
          container.style.pointerEvents = '';
        }
      }
    };
  }, [isOpen]);
}
