
"use client";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation, { MobileBottomBar } from "@/components/Navigation";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import ThemeBody from "@/components/ThemeBody";
import IOSOnboarding from "@/components/IOSOnboarding";
import { reportWebVitals } from "@/lib/performance";

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
      const capacitorDetected = !!(window as any).Capacitor;
      setIsCapacitor(capacitorDetected);
      
      if (capacitorDetected) {
        console.log('🍎 Capacitor detected - applying iOS styling and keyboard setup');
        document.body.classList.add('capacitor-ios');
        
        // Check if onboarding should be shown
        const onboardingCompleted = localStorage.getItem('held-ios-onboarding-completed');
        if (!onboardingCompleted) {
          setShowIOSOnboarding(true);
        }
        
        // Import and configure Capacitor Keyboard plugin
        import('@capacitor/keyboard').then(({ Keyboard }) => {
          // Enable keyboard
          Keyboard.setAccessoryBarVisible({ isVisible: false });
          Keyboard.setScroll({ isDisabled: false });
          Keyboard.setStyle({ style: 'DARK' });
          
          console.log('✅ Keyboard plugin configured');
        }).catch(err => {
          console.log('⚠️ Keyboard plugin not available:', err);
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
        
        {/* iOS app icons */}
        <link rel="apple-touch-icon" href="/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-144x144.png" />
        
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
              
              /* Force input styling */
              input[type="text"], input[type="email"], input[type="password"], 
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
                  <img src="/held-logomark.svg" alt="Held" className="h-10 w-10 opacity-80 hover:opacity-100 transition-opacity" />
                
                  <div className="flex items-center gap-6 text-sm">
                  <a href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</a>
                  <a href="/terms" className="text-gray-600 hover:text-gray-900">Terms</a>
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
