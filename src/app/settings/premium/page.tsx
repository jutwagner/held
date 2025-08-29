"use client";


import SectionNav from '@/components/settings/SectionNav';
import PremiumSection from '@/components/settings/PremiumSection';
import { useAuth } from '@/contexts/AuthContext';

export default function PremiumSettings() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="hidden md:block w-64 border-r bg-white">
        <SectionNav section="premium" />
      </aside>
      {/* Mobile bottom nav - persistent */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white z-30 border-t">
        <SectionNav section="premium" mobile />
      </nav>
      <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto pb-16 md:pb-8 flex flex-col items-center justify-center">
  <h1 className="text-3xl font-serif font-bold mb-8" style={{ fontFamily: 'Libre Baskerville, serif' }}>Held+</h1>
        <PremiumSection user={user ?? undefined} />
      </main>
    </div>
  );
}
