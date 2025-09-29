'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navigation, { MobileBottomBar } from '@/components/Navigation';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import ThemeBody from '@/components/ThemeBody';
import IOSOnboarding from '@/components/IOSOnboarding';
import { AuthProvider } from '@/contexts/AuthContext';
import { reportWebVitals } from '@/lib/performance';
import { KeyboardStyle } from '@capacitor/keyboard';

interface AppClientShellProps {
  children: React.ReactNode;
}

export default function AppClientShell({ children }: AppClientShellProps) {
  const pathname = usePathname();
  const isPassport = pathname?.startsWith('/passport');
  const [showIOSOnboarding, setShowIOSOnboarding] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Initialize Web Vitals monitoring
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        onCLS(reportWebVitals);
        onINP(reportWebVitals);
        onFCP(reportWebVitals);
        onLCP(reportWebVitals);
        onTTFB(reportWebVitals);
      });
    }

    // iOS/Capacitor detection and setup
    if (typeof window !== 'undefined') {
      let observer: MutationObserver | null = null;
      let touchHandler: ((e: TouchEvent) => void) | null = null;

      const capacitorGlobal = (window as any).Capacitor;
      const hasCapacitor = Boolean(capacitorGlobal);
      const isNativePlatform = hasCapacitor &&
        typeof capacitorGlobal.isNativePlatform === 'function' &&
        capacitorGlobal.isNativePlatform();
      const capacitorDetected = hasCapacitor && isNativePlatform;

      console.log('🔍 Capacitor Detection:', {
        hasCapacitor,
        isNativePlatform,
        capacitorDetected,
        userAgent: navigator.userAgent,
        isWeb: !capacitorDetected,
      });

      setIsCapacitor(capacitorDetected);

      if (capacitorDetected) {
        console.log('🍎 Capacitor detected - applying iOS styling and keyboard setup');
        document.body.classList.add('capacitor-ios');

        const onboardingCompleted = localStorage.getItem('held-ios-onboarding-completed');
        if (!onboardingCompleted) {
          setShowIOSOnboarding(true);
        } else if (window.location.pathname === '/') {
          window.location.href = '/registry';
        }

        import('@capacitor/keyboard').then(({ Keyboard }) => {
          Keyboard.setAccessoryBarVisible({ isVisible: false });
          Keyboard.setScroll({ isDisabled: false });
          Keyboard.setStyle({ style: KeyboardStyle.Dark });
          console.log('✅ Keyboard plugin configured');
        }).catch((err) => {
          console.log('⚠️ Keyboard plugin not available:', err);
        });

        const enableInputs = () => {
          const inputs = document.querySelectorAll('input, textarea, select');
          inputs.forEach((input) => {
            const element = input as HTMLElement;
            element.removeAttribute('readonly');
            element.removeAttribute('disabled');
            element.style.userSelect = 'text';
            (element as HTMLElement).style.webkitUserSelect = 'text';
            element.style.pointerEvents = 'auto';
            element.setAttribute('contenteditable', 'true');
          });
          console.log(`🔧 Enabled ${inputs.length} input fields for iOS`);
        };

        enableInputs();
        observer = new MutationObserver(() => {
          setTimeout(enableInputs, 100);
        });
        observer.observe(document.body, { childList: true, subtree: true });

        touchHandler = (e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            setTimeout(() => {
              (target as HTMLInputElement).focus();
              console.log('🎯 Forced focus on input:', target.tagName);
            }, 50);
          }
        };
        document.addEventListener('touchstart', touchHandler, { passive: true });

        (window as any).resetOnboarding = () => {
          localStorage.removeItem('held-ios-onboarding-completed');
          setShowIOSOnboarding(true);
          console.log('🔄 Onboarding reset - showing now');
        };

        localStorage.removeItem('held-ios-onboarding-completed');
        setShowIOSOnboarding(true);
      }
      return () => {
        if (observer) {
          observer.disconnect();
        }
        if (touchHandler) {
          document.removeEventListener('touchstart', touchHandler);
        }
      };
    }
    return undefined;
  }, []);

  return (
    <AuthProvider>
      <ThemeBody>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {!isPassport && <Navigation />}
          <main className="held-container held-container-wide py-6">
            <EmailVerificationBanner />
            {children}
          </main>
          {!isPassport && <MobileBottomBar />}
        </div>
        {isCapacitor && showIOSOnboarding && (
          <IOSOnboarding
            onComplete={() => {
              setShowIOSOnboarding(false);
              localStorage.setItem('held-ios-onboarding-completed', 'true');
            }}
          />
        )}
      </ThemeBody>
    </AuthProvider>
  );
}
