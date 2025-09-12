"use client";

import SectionNav from '@/components/settings/SectionNav';
import DataSection from '@/components/settings/DataSection';
import DangerZoneSection from '@/components/settings/DangerZoneSection';
import { useAuth } from '@/contexts/AuthContext';

export default function DataSettings() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row">
      <aside className="hidden md:block w-64 border-r bg-white dark:bg-gray-800 dark:border-gray-700">
        <SectionNav section="data" />
      </aside>
      {/* Mobile bottom nav - persistent */}
      <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto pb-16 md:pb-8">
        <DataSection user={user ?? undefined} />
        <DangerZoneSection user={user ?? undefined} />
      </main>
    </div>
  );
}
