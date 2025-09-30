import { useEffect, useState } from 'react';

const isIOSDevice = () =>
  typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any)?.standalone === true);

function getFallbackTopInset(): number {
  if (!isIOSDevice()) return 0;
  if (typeof window === 'undefined') return 44;

  const portrait = window.innerHeight >= window.innerWidth;
  if (!portrait) return 0;

  const screenHeight = window.screen.height;
  const dynamicIslandHeights = [852, 932];
  if (dynamicIslandHeights.includes(screenHeight)) return 59;

  const standardNotchHeights = [812, 844, 896, 926, 780, 800];
  if (standardNotchHeights.includes(screenHeight)) return 44;

  return 44;
}

export function useSafeArea() {
  const [topInset, setTopInset] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return getFallbackTopInset();
  });

  useEffect(() => {
    const updateInset = () => {
      let measured = 0;

      if (typeof document !== 'undefined') {
        const probe = document.createElement('div');
        probe.style.position = 'fixed';
        probe.style.top = '0';
        probe.style.left = '0';
        probe.style.right = '0';
        probe.style.height = 'constant(safe-area-inset-top)';
        probe.style.height = 'env(safe-area-inset-top)';
        probe.style.visibility = 'hidden';
        probe.style.pointerEvents = 'none';
        document.body.appendChild(probe);
        measured = parseFloat(window.getComputedStyle(probe).height) || 0;
        document.body.removeChild(probe);
      }

      if (measured < 2 && (isStandalone() || isIOSDevice())) {
        measured = getFallbackTopInset();
      }

      setTopInset(measured);
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--safe-area-top', `${measured}px`);
      }
    };

    updateInset();
    window.addEventListener('orientationchange', updateInset);
    window.addEventListener('resize', updateInset);
    return () => {
      window.removeEventListener('orientationchange', updateInset);
      window.removeEventListener('resize', updateInset);
    };
  }, []);

  return { topInset };
}
