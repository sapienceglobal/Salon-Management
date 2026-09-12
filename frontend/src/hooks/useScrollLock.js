import { useEffect } from 'react';

/**
 * Locks the scroll on the main container when a modal is open.
 * Adds padding to prevent layout shift caused by the disappearing scrollbar.
 */
export function useScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalStyle = window.getComputedStyle(document.body);
    const originalPaddingRight = originalStyle.paddingRight;
    const originalOverflow = originalStyle.overflow;

    // Lock scroll and add padding to prevent layout shift
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `calc(${originalPaddingRight} + ${scrollbarWidth}px)`;
    }

    // Disable interactions on background to stop mousewheel on internal scrolls
    const mainContainer = document.getElementById('main-scroll-container');
    let originalPointerEvents = '';
    if (mainContainer) {
      originalPointerEvents = mainContainer.style.pointerEvents;
      mainContainer.style.pointerEvents = 'none';
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      if (mainContainer) {
        mainContainer.style.pointerEvents = originalPointerEvents;
      }
    };
  }, [isOpen]);
}
