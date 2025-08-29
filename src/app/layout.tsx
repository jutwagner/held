
"use client";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation, { MobileBottomBar } from "@/components/Navigation";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";

import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
            <MobileBottomBar />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
