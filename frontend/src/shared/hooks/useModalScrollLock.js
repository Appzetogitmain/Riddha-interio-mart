import { useEffect } from 'react';

const LOCK_CLASS = 'scroll-locked';

// A "modal" is a visible full-screen fixed overlay (fixed + inset-0) sitting above page content.
const isModalOverlay = (el) => {
  if (!el.classList.contains('fixed') || !el.classList.contains('inset-0')) return false;
  const cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') return false;
  if (parseFloat(cs.opacity) === 0) return false;
  const z = parseInt(cs.zIndex, 10);
  return Number.isFinite(z) && z >= 40;
};

/**
 * Locks background page scroll whenever any modal / full-screen overlay is open, anywhere in the
 * app (user, admin, seller, delivery). Watches the DOM, so individual modals need no changes.
 * Uses a class on <html> so it never fights modals that set body overflow themselves.
 */
const useModalScrollLock = () => {
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const open = Array.from(document.body.querySelectorAll('.fixed.inset-0')).some(isModalOverlay);
      document.documentElement.classList.toggle(LOCK_CLASS, open);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    update();

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      document.documentElement.classList.remove(LOCK_CLASS);
    };
  }, []);
};

export default useModalScrollLock;
