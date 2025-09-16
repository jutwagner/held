
"use client";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation, { MobileBottomBar } from "@/components/Navigation";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import ThemeBody from "@/components/ThemeBody";
import { reportWebVitals } from "@/lib/performance";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPassport = pathname?.startsWith('/passport');

  useEffect(() => {
    // Initialize Web Vitals monitoring
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        onCLS(reportWebVitals);
        onINP(reportWebVitals); // INP replaces FID in web-vitals v3+
        onFCP(reportWebVitals);
        onLCP(reportWebVitals);
        onTTFB(reportWebVitals);
      });
    }

    // Force iOS native styling
    if (typeof window !== 'undefined') {
      // Check if we're in Capacitor
      const isCapacitor = !!(window as any).Capacitor;
      
      if (isCapacitor) {
        console.log('🍎 Capacitor detected - applying iOS fixes');
        
        // Force Dynamic Island safe area
        const screenHeight = window.screen.height;
        const screenWidth = window.screen.width;
        const pixelRatio = window.devicePixelRatio;
        
        const isDynamicIslandDevice = (
          (screenWidth === 393 && screenHeight === 852 && pixelRatio === 3) ||
          (screenWidth === 430 && screenHeight === 932 && pixelRatio === 3) ||
          (screenWidth === 428 && screenHeight === 926 && pixelRatio === 3)
        );
        
        console.log('📱 Device info:', { screenWidth, screenHeight, pixelRatio, isDynamicIslandDevice });
        
        // Add CSS directly to head
        const style = document.createElement('style');
        style.innerHTML = `
          /* Force iOS native styling */
          body {
            padding-top: ${isDynamicIslandDevice ? '60px' : '44px'} !important;
          }
          
          /* Force sticky navigation with extended blur background */
          nav[class*="sticky"] {
            top: 0px !important;
            padding-top: ${isDynamicIslandDevice ? '60px' : '44px'} !important;
            margin-top: ${isDynamicIslandDevice ? '-60px' : '-44px'} !important;
          }
          
          /* Force remove Safari input styling */
          input, textarea, select {
            -webkit-appearance: none !important;
            appearance: none !important;
            border-radius: 8px !important;
            border: 1px solid #d1d5db !important;
            background-color: rgba(255, 255, 255, 0.9) !important;
            outline: none !important;
            -webkit-tap-highlight-color: transparent !important;
            font-size: 16px !important;
          }
          
          input::-webkit-contacts-auto-fill-button,
          input::-webkit-credentials-auto-fill-button,
          input::-webkit-caps-lock-indicator,
          input::-webkit-clear-button {
            display: none !important;
            visibility: hidden !important;
          }
        `;
        document.head.appendChild(style);
        
        // Force remove Safari UI on all inputs
        const forceInputStyling = () => {
          const inputs = document.querySelectorAll('input, textarea, select');
          inputs.forEach((input: any) => {
            input.style.webkitAppearance = 'none';
            input.style.appearance = 'none';
            input.style.outline = 'none';
            input.style.webkitTapHighlightColor = 'transparent';
            input.style.fontSize = '16px';
          });
        };
        
        // Run immediately and on DOM changes
        forceInputStyling();
        const observer = new MutationObserver(forceInputStyling);
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Clear iOS app cache to fix chunk loading issues
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
              registration.unregister();
            }
          });
        }
        
        // Force reload chunks on chunk load error
        window.addEventListener('error', (e) => {
          if (e.message && e.message.includes('ChunkLoadError')) {
            console.log('🔄 ChunkLoadError detected, reloading...');
            window.location.reload();
          }
        });
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
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        
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
                  padding-top: 44px !important;
                }
                
                /* Force sticky navigation with extended blur */
                nav[class*="sticky"] {
                  top: 0px !important;
                  padding-top: 44px !important;
                  margin-top: -44px !important;
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
      </body>
    </html>
  );
}
