
"use client";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <Navigation />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
