import { useEffect, useState } from 'react';

export function useSafeArea() {
  const [topInset, setTopInset] = useState(0);

  useEffect(() => {
    const updateInset = () => {
      const test = document.createElement('div');
      test.style.position = 'fixed';
      test.style.top = '0';
      test.style.left = '0';
      test.style.right = '0';
      test.style.height = 'constant(safe-area-inset-top)';
      test.style.height = 'env(safe-area-inset-top)';
      test.style.visibility = 'hidden';
      document.body.appendChild(test);
      const computed = parseFloat(window.getComputedStyle(test).height) || 0;
      document.body.removeChild(test);
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
