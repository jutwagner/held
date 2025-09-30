import { useEffect, useState } from 'react';

const isIOSDevice = () =>
  typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);

export function useSafeArea() {
  const [topInset, setTopInset] = useState(0);

  useEffect(() => {
    const updateInset = () => {
      let computed = 0;

      if (typeof document !== 'undefined') {
        const test = document.createElement('div');
        test.style.position = 'fixed';
        test.style.top = '0';
        test.style.left = '0';
        test.style.right = '0';
        test.style.height = 'constant(safe-area-inset-top)';
        test.style.height = 'env(safe-area-inset-top)';
        test.style.visibility = 'hidden';
        test.style.pointerEvents = 'none';
        document.body.appendChild(test);
        computed = parseFloat(window.getComputedStyle(test).height) || 0;
        document.body.removeChild(test);
      }

      if (computed < 10 && isIOSDevice()) {
        // Fallback values for iOS notch devices when env() reports zero (e.g., standalone mode)
        const portrait = typeof window !== 'undefined' && window.innerHeight >= window.innerWidth;
        if (portrait) {
          // Dynamic Island devices use a slightly larger inset (~59px), others ~44px
          const dynamicIslandSizes = [852, 932];
          const screenHeight = typeof window !== 'undefined' ? window.screen.height : 0;
          const hasDynamicIsland = dynamicIslandSizes.includes(screenHeight);
          computed = hasDynamicIsland ? 59 : 44;
        } else {
          computed = 0;
        }
      }

      setTopInset(computed);
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
