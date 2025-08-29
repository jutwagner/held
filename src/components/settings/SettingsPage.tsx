"use client";
import React, { useState, useEffect } from 'react';
import SectionNav from './SectionNav';
import type { SectionKey } from './SectionNav';
import SaveBar from './SaveBar';
import ProfileSection from './ProfileSection';
import AppearanceSection from './AppearanceSection';
import AccountSection from './AccountSection';
import DataSection from './DataSection';
import NotificationsSection from './NotificationsSection';
import MessagesSection from './MessagesSection';
import PremiumSection from './PremiumSection';
import DangerZoneSection from './DangerZoneSection';
import Toast from '@/components/Toast';
import { updateUser, getUser } from '@/lib/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import type { Theme, Density } from '@/types';

interface SettingsPageProps {
  initialSection?: SectionKey;
}

export default function SettingsPage({ initialSection }: SettingsPageProps) {
  // Hydration guard: only render main content after client hydration
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const { user, setUser, loading } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [section, setSection] = useState<SectionKey>(initialSection || 'profile');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [theme, setTheme] = useState<Theme>('light');
  const [density, setDensity] = useState<Density>('standard');
  const [typeTitleSerif, setTypeTitleSerif] = useState(true);
  const [typeMetaMono, setTypeMetaMono] = useState(false);
  const [isPublicProfile, setIsPublicProfile] = useState(user?.isPublicProfile ?? false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setHandle(user.handle || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
      setTheme((user.theme as Theme) || 'light');
      setDensity((user.density as Density) || 'standard');
      setTypeTitleSerif(user.typeTitleSerif ?? true);
      setTypeMetaMono(user.typeMetaMono ?? false);
      setIsPublicProfile(user.isPublicProfile ?? false);
    }
  }, [user]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateUser(user.uid!, {
        displayName,
        handle,
        bio,
        avatarUrl,
        theme,
        typeTitleSerif,
        typeMetaMono,
        density,
        isPublicProfile,
      });
      const updatedUser = await getUser(user.uid!);
      if (updatedUser) setUser(updatedUser);
      setDirty(false);
      setToast({ message: 'Settings saved!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to save settings. Please try again.', type: 'error' });
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        <aside className="hidden md:block w-64 border-r bg-white">
          <SectionNav section={section} />
        </aside>
        {/* Mobile bottom nav - persistent */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white z-30 border-t">
          <SectionNav section={section} mobile />
        </nav>
        <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto pb-16 md:pb-8">
          {!hydrated ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-500 text-lg">Loading…</span>
            </div>
          ) : loading && !user ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-500 text-lg">Loading user…</span>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-serif font-bold mb-8" style={{ fontFamily: 'Libre Baskerville, serif' }}>Settings</h1>
              {section === 'profile' && (
                <ProfileSection
                  user={user ?? undefined}
                  setUser={setUser}
                  displayName={displayName}
                  setDisplayName={val => { setDisplayName(val); markDirty(); }}
                  handle={handle}
                  setHandle={val => { setHandle(val); markDirty(); }}
                  bio={bio}
                  setBio={val => { setBio(val); markDirty(); }}
                  avatarUrl={avatarUrl}
                  setAvatarUrl={val => { setAvatarUrl(val); markDirty(); }}
                  theme={theme}
                  typeTitleSerif={typeTitleSerif}
                  typeMetaMono={typeMetaMono}
                  density={density}
                  isPublicProfile={isPublicProfile}
                  setIsPublicProfile={val => { setIsPublicProfile(val); markDirty(); }}
                  onAppearanceChange={changes => {
                    if (changes.theme !== undefined) setTheme(changes.theme as Theme);
                    if (changes.density !== undefined) setDensity(changes.density as Density);
                    if (changes.typeTitleSerif !== undefined) setTypeTitleSerif(changes.typeTitleSerif);
                    if (changes.typeMetaMono !== undefined) setTypeMetaMono(changes.typeMetaMono);
                    markDirty();
                  }}
                />
              )}
              {section === 'account' && <AccountSection user={user ?? undefined} />}
              {section === 'data' && <DataSection user={user ?? undefined} />}
              {section === 'messages' && <MessagesSection />}
              {section === 'notifications' && <NotificationsSection user={user ?? undefined} />}
              {section === 'premium' && <PremiumSection user={user ?? undefined} />}
              {section === 'danger' && <DangerZoneSection user={user ?? undefined} />}
            </>
          )}
        </main>
        <SaveBar onSave={handleSave} />
        <div className="hidden md:block sticky bottom-0 left-0 right-0 bg-white border-t p-4 z-20">
          <button
            className="bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold text-base shadow-md active:scale-95 transition font-mono"
            onClick={handleSave}
            disabled={!dirty}
          >
            Done / Save
          </button>
        </div>
      </div>
    </div>
  );
}