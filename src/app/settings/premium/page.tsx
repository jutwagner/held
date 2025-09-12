"use client";

import SettingsLayout from '@/components/settings/SettingsLayout';
import PremiumSection from '@/components/settings/PremiumSection';
import { useAuth } from '@/contexts/AuthContext';

export default function PremiumSettings() {
  const { user } = useAuth();
  return (
    <SettingsLayout section="premium">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-serif font-bold mb-8 text-gray-900 dark:text-gray-100" style={{ fontFamily: 'Libre Baskerville, serif' }}>Held+</h1>
        <PremiumSection user={user ?? undefined} />
      </div>
    </SettingsLayout>
  );
}
