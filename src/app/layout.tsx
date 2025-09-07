
"use client";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation, { MobileBottomBar } from "@/components/Navigation";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";

import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';
const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPassport = pathname?.startsWith('/passport');
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
        {/* Prevent zoom on form fields (iOS) */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* Preconnect to Firebase Storage for faster image loads */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className + " font-sans antialiased"}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
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
        </AuthProvider>
      </body>
    </html>
  );
}
