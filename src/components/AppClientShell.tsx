'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navigation, { MobileBottomBar } from '@/components/Navigation';
import Link from 'next/link';
import Image from 'next/image';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import ThemeBody from '@/components/ThemeBody';
import IOSOnboarding from '@/components/IOSOnboarding';
import { AuthProvider } from '@/contexts/AuthContext';
import { reportWebVitals } from '@/lib/performance';
import { KeyboardStyle } from '@capacitor/keyboard';
import { useSafeArea } from '@/hooks/useSafeArea';
import { useAuth } from '@/contexts/AuthContext';

interface AppClientShellProps {
  children: React.ReactNode;
}

function FloatingCapacitorElements() {
  // No floating elements for Capacitor - using standard navigation
  return null;
}

// Inner component that has access to AuthContext
function AppClientShellInner({ children }: AppClientShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isPassport = pathname?.startsWith('/passport');
  const [showIOSOnboarding, setShowIOSOnboarding] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);
  const { user, loading } = useAuth();
  const hideNavigation =
    isPassport || pathname === '/rotations/new' || pathname === '/registry/new' || isCapacitor;
  const { topInset } = useSafeArea();
  const navHeight = 64;
  const mainTopPadding = topInset + (hideNavigation ? 0 : navHeight);

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
      const isIOSDevice = /iPhone|iPad|iPod/.test(window.navigator.userAgent);
      const previousBodyBackground = isIOSDevice ? document.body.style.backgroundColor : null;
      const previousHtmlBackground = isIOSDevice ? document.documentElement.style.backgroundColor : null;

      if (isIOSDevice) {
        document.body.style.backgroundColor = '#ffffff';
        document.documentElement.style.backgroundColor = '#ffffff';
      }

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

        // Redirect to registry from home if on Capacitor
        if (window.location.pathname === '/') {
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
        if (isIOSDevice) {
          if (previousBodyBackground !== null) {
            document.body.style.backgroundColor = previousBodyBackground;
          }
          if (previousHtmlBackground !== null) {
            document.documentElement.style.backgroundColor = previousHtmlBackground;
          }
        }
      };
    }
    return undefined;
  }, []);

  // Handle onboarding after auth is loaded - only check once
  useEffect(() => {
    if (!loading && isCapacitor && typeof window !== 'undefined') {
      // Check if we've already made the onboarding decision this session
      const onboardingDecisionMade = sessionStorage.getItem('onboarding-decision-made');
      if (onboardingDecisionMade) {
        console.log('[Onboarding] Decision already made this session, skipping check');
        return;
      }

      const onboardingCompleted = localStorage.getItem('held-ios-onboarding-completed');
      if (!onboardingCompleted && !user) {
        // Only show onboarding if user is not logged in and auth has finished loading
        console.log('[Onboarding] Showing onboarding - user not logged in');
        setShowIOSOnboarding(true);
      } else {
        console.log('[Onboarding] Skipping onboarding - user logged in or already completed');
      }
      
      // Mark decision as made for this session
      sessionStorage.setItem('onboarding-decision-made', 'true');
    }
  }, [loading, user, isCapacitor]);

  // Custom swipe-to-go-back and swipe-to-go-forward gesture handler for Capacitor
  useEffect(() => {
    if (!isCapacitor || typeof window === 'undefined') return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isSwipeActive = false;
    let swipeDirection: 'back' | 'forward' | null = null;
    const swipeThreshold = 80; // minimum distance for swipe
    const edgeThreshold = 80; // must start within 80px of edge
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
      
      // Activate swipe if starting from left edge (back) or right edge (forward)
      if (touchStartX <= edgeThreshold) {
        isSwipeActive = true;
        swipeDirection = 'back';
      } else if (touchStartX >= screenWidth - edgeThreshold) {
        isSwipeActive = true;
        swipeDirection = 'forward';
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipeActive) return;
      
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
      
      const swipeDistance = touchEndX - touchStartX;
      const verticalDistance = Math.abs(touchEndY - touchStartY);
      
      const mainContent = document.querySelector('main');
      if (!mainContent) return;
      
      // Back gesture: swipe right from left edge
      if (swipeDirection === 'back' && swipeDistance > 0 && swipeDistance < 300 && verticalDistance < 100) {
        const translateX = Math.min(swipeDistance, 300);
        const opacity = Math.max(0.3, 1 - (translateX / 300) * 0.7);
        (mainContent as HTMLElement).style.transform = `translateX(${translateX}px)`;
        (mainContent as HTMLElement).style.opacity = opacity.toString();
        (mainContent as HTMLElement).style.transition = 'none';
      }
      // Forward gesture: swipe left from right edge
      else if (swipeDirection === 'forward' && swipeDistance < 0 && Math.abs(swipeDistance) < 300 && verticalDistance < 100) {
        const translateX = Math.max(swipeDistance, -300);
        const opacity = Math.max(0.3, 1 - (Math.abs(translateX) / 300) * 0.7);
        (mainContent as HTMLElement).style.transform = `translateX(${translateX}px)`;
        (mainContent as HTMLElement).style.opacity = opacity.toString();
        (mainContent as HTMLElement).style.transition = 'none';
      }
    };

    const handleTouchEnd = () => {
      if (!isSwipeActive) return;
      
      const swipeDistance = touchEndX - touchStartX;
      const verticalDistance = Math.abs(touchEndY - touchStartY);
      
      // Reset visual feedback
      const mainContent = document.querySelector('main');
      if (mainContent) {
        (mainContent as HTMLElement).style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        (mainContent as HTMLElement).style.transform = 'translateX(0)';
        (mainContent as HTMLElement).style.opacity = '1';
      }
      
      // Back gesture
      if (
        swipeDirection === 'back' &&
        touchStartX <= edgeThreshold &&
        swipeDistance > swipeThreshold &&
        verticalDistance < swipeThreshold * 2
      ) {
        console.log('[Swipe] ✅ Detected left-to-right swipe, going back');
        setTimeout(() => router.back(), 100);
      }
      // Forward gesture
      else if (
        swipeDirection === 'forward' &&
        touchStartX >= screenWidth - edgeThreshold &&
        swipeDistance < -swipeThreshold &&
        verticalDistance < swipeThreshold * 2
      ) {
        console.log('[Swipe] ✅ Detected right-to-left swipe, going forward');
        setTimeout(() => router.forward(), 100);
      }
      
      isSwipeActive = false;
      swipeDirection = null;
    };

    const handleTouchCancel = () => {
      // Reset on cancel
      const mainContent = document.querySelector('main');
      if (mainContent) {
        (mainContent as HTMLElement).style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        (mainContent as HTMLElement).style.transform = 'translateX(0)';
        (mainContent as HTMLElement).style.opacity = '1';
      }
      isSwipeActive = false;
      swipeDirection = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isCapacitor, router]);

  // Handle Capacitor back button and swipe gesture
  useEffect(() => {
    if (isCapacitor && typeof window !== 'undefined') {
      import('@capacitor/app').then(({ App }) => {
        const backButtonListener = App.addListener('backButton', () => {
          // Use browser's back functionality which should work with the swipe gesture
          console.log('[Back Button] Navigating back, history length:', window.history.length);
          if (window.history.length > 1) {
            router.back();
          }
        });

        return () => {
          backButtonListener.then((listener) => listener.remove());
        };
      }).catch((err) => {
        console.log('⚠️ Capacitor App plugin not available:', err);
      });
    }
  }, [isCapacitor, router]);

  return (
    <ThemeBody>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {!hideNavigation && <Navigation />}
        {isCapacitor && <FloatingCapacitorElements />}
        <main className="held-container held-container-wide pb-28 md:pb-16">
          <EmailVerificationBanner />
          {children}
          {!isPassport && (
            <div className="mt-16 border-t border-gray-200 pt-6 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 order-2 md:order-1">
                  <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-100">Terms</Link>
                  <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
                  <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100">Privacy</Link>
                </div>
                <Link
                  href="/"
                  className="order-1 md:order-2 inline-flex items-center justify-center rounded-full px-3 py-3"
                  aria-label="Held home"
                >
                  <Image src="/held-logomark.svg" alt="Held" width={28} height={28} className="h-7 w-7" />
                </Link>
                <div className="order-3">
                  <Link href="/donate" className="font-lg hover:text-gray-900 dark:hover:text-gray-100">
                    Donate
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
        {!isPassport && (
          <MobileBottomBar showProfileIcon={hideNavigation && isCapacitor} />
        )}
      </div>
      {isCapacitor && showIOSOnboarding && (
        <IOSOnboarding
          onComplete={() => {
            console.log('[Onboarding] Onboarding completed, hiding and marking as done');
            setShowIOSOnboarding(false);
            localStorage.setItem('held-ios-onboarding-completed', 'true');
            sessionStorage.setItem('onboarding-decision-made', 'true');
          }}
        />
      )}
    </ThemeBody>
  );
}

// Outer wrapper component that provides AuthContext
export default function AppClientShell({ children }: AppClientShellProps) {
  return (
    <AuthProvider>
      <AppClientShellInner>{children}</AppClientShellInner>
    </AuthProvider>
  );
}
