
"use client";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation, { MobileBottomBar } from "@/components/Navigation";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import ThemeBody from "@/components/ThemeBody";
import IOSOnboarding from "@/components/IOSOnboarding";
import { reportWebVitals } from "@/lib/performance";
import { KeyboardStyle } from '@capacitor/keyboard';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
      // More robust Capacitor detection - check for Capacitor AND platform info
      const hasCapacitor = !!(window as any).Capacitor;
      const isNativePlatform = hasCapacitor && 
                               (window as any).Capacitor.isNativePlatform && 
                               (window as any).Capacitor.isNativePlatform();
      const capacitorDetected = hasCapacitor && isNativePlatform;
      
      // Debug logging
      console.log('🔍 Capacitor Detection:', {
        hasCapacitor,
        isNativePlatform,
        capacitorDetected,
        userAgent: navigator.userAgent,
        isWeb: !capacitorDetected
      });
      
      setIsCapacitor(capacitorDetected);
      
      if (capacitorDetected) {
        console.log('🍎 Capacitor detected - applying iOS styling and keyboard setup');
        document.body.classList.add('capacitor-ios');
        
        // Check if onboarding should be shown
        const onboardingCompleted = localStorage.getItem('held-ios-onboarding-completed');
        if (!onboardingCompleted) {
          setShowIOSOnboarding(true);
        } else {
          // For returning iOS users, redirect to registry if on home page
          if (window.location.pathname === '/') {
            window.location.href = '/registry';
          }
        }
        
        // Import and configure Capacitor Keyboard plugin
        import('@capacitor/keyboard').then(({ Keyboard }) => {
          // Enable keyboard
          Keyboard.setAccessoryBarVisible({ isVisible: false });
          Keyboard.setScroll({ isDisabled: false });
          Keyboard.setStyle({ style: KeyboardStyle.Dark });
          
          console.log('✅ Keyboard plugin configured');
        }).catch(err => {
          console.log('⚠️ Keyboard plugin not available:', err);
        });

        // Aggressive keyboard fix - remove readonly/disabled attributes
        const enableInputs = () => {
          const inputs = document.querySelectorAll('input, textarea, select');
          inputs.forEach((input: any) => {
            input.removeAttribute('readonly');
            input.removeAttribute('disabled');
            input.style.userSelect = 'text';
            input.style.webkitUserSelect = 'text';
            input.style.pointerEvents = 'auto';
            input.setAttribute('contenteditable', 'true');
          });
          console.log(`🔧 Enabled ${inputs.length} input fields for iOS`);
        };

        // Run immediately and on DOM changes
        enableInputs();
        const observer = new MutationObserver(() => {
          setTimeout(enableInputs, 100);
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Force focus on tap
        document.addEventListener('touchstart', (e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            setTimeout(() => {
              (target as HTMLInputElement).focus();
              console.log('🎯 Forced focus on input:', target.tagName);
            }, 50);
          }
        });

        // Debug function to reset onboarding
        (window as any).resetOnboarding = () => {
          localStorage.removeItem('held-ios-onboarding-completed');
          setShowIOSOnboarding(true);
          console.log('🔄 Onboarding reset - showing now');
        };

        // Force show onboarding for testing (remove this line when done testing)
        localStorage.removeItem('held-ios-onboarding-completed');
        setShowIOSOnboarding(true);
      }
    }
  }, []);
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-8ZB18NNRPR"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-8ZB18NNRPR');
`}}
        />
        {/* iOS native app configuration */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Held" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        
        {/* iOS app icons */}
        <link rel="apple-touch-icon" sizes="144x144" href="/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />
        
        {/* Web app manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Force iOS native styling directly in head */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Capacitor iOS specific overrides */
            @media screen and (-webkit-min-device-pixel-ratio: 2) {
              /* Force body padding for Dynamic Island devices */
              @media screen and (device-width: 393px) and (device-height: 852px),
                     screen and (device-width: 430px) and (device-height: 932px),
                     screen and (device-width: 428px) and (device-height: 926px) {
                body {
                  padding-top: 60px !important;
                }
              }
              
              /* All other iOS devices */
              @media screen and (max-device-width: 428px) {
                body {
                }
                
                /* Force sticky navigation with extended blur */
                nav[class*="sticky"] {
                  top: 0px !important;
                }
              }
              
              /* Dynamic Island sticky navigation with extended blur */
              @media screen and (device-width: 393px) and (device-height: 852px),
                     screen and (device-width: 430px) and (device-height: 932px),
                     screen and (device-width: 428px) and (device-height: 926px) {
                nav[class*="sticky"] {
                  top: 0px !important;
                  padding-top: 60px !important;
                  margin-top: -60px !important;
                }
              }
              
              /* Force input styling and enable keyboard */
              input[type="text"], input[type="email"], input[type="password"], 
              input[type="search"], input[type="tel"], input[type="url"],
              textarea, select {
                -webkit-appearance: none !important;
                appearance: none !important;
                border-radius: 8px !important;
                border: 1px solid #d1d5db !important;
                background: rgba(255, 255, 255, 0.9) !important;
                outline: none !important;
                -webkit-tap-highlight-color: transparent !important;
                font-size: 16px !important;
                box-shadow: none !important;
                -webkit-user-select: text !important;
                user-select: text !important;
                pointer-events: auto !important;
                touch-action: manipulation !important;
                -webkit-touch-callout: default !important;
              }
              
              /* Force input focus state */
              input:focus, textarea:focus, select:focus {
                border-color: #3b82f6 !important;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
              }
              
              /* Hide Safari UI elements */
              input::-webkit-contacts-auto-fill-button,
              input::-webkit-credentials-auto-fill-button,
              input::-webkit-caps-lock-indicator,
              input::-webkit-clear-button,
              input::-webkit-inner-spin-button,
              input::-webkit-outer-spin-button {
                display: none !important;
                visibility: hidden !important;
                -webkit-appearance: none !important;
              }
            }
          `
        }} />
        {/* Preconnect to Firebase Storage for faster image loads */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ThemeBody>
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <Navigation />
              <EmailVerificationBanner />
              {children}
            {/* Site-wide Footer (hidden on passport pages) */}
            {!isPassport && (
              <footer className="w-full">
                <div className="w-full py-8 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500">© 2025 Held</div>
                  <img src="/held-logomark.svg" alt="Held" className="h-10 w-10 opacity-80 hover:opacity-100 transition-opacity " />
                
                  <div className="flex items-center gap-6 text-sm">
                    <a href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</a>
                    <a href="/terms" className="text-gray-600 hover:text-gray-900">Terms</a>
                    <a href="/donate" className="text-gray-600 hover:text-gray-900">Donate</a>
                  </div>
                </div>
              </footer>
            )}
              {/* Mobile-only spacer to prevent bottom bar overlap */}
              <div className="md:hidden" style={{ height: 'calc(env(safe-area-inset-bottom) + 72px)' }} />
              <MobileBottomBar />
            </div>
          </ThemeBody>
        </AuthProvider>
        
        {/* iOS Onboarding - Only show on Capacitor and first launch */}
        {showIOSOnboarding && isCapacitor && (
          <IOSOnboarding onComplete={() => setShowIOSOnboarding(false)} />
        )}
      </body>
    </html>
  );
}
