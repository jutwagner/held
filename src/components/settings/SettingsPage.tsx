"use client";
import React, { useState, useEffect } from 'react';
import SettingsTopNav from './SettingsTopNav';
import type { SectionKey } from './SectionNav';
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
  const [saving, setSaving] = useState(false);

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

  // Auto-save when dirty changes
  useEffect(() => {
    if (dirty) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 1000); // Auto-save after 1 second of no changes

      return () => clearTimeout(timeoutId);
    }
  }, [dirty, displayName, handle, bio, avatarUrl, theme, typeTitleSerif, typeMetaMono, density, isPublicProfile]);

  const handleSave = async () => {
    if (!user || saving) return;
    try {
      setSaving(true);
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
    } finally {
      setSaving(false);
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <SettingsTopNav section={section} />
        {saving && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            </div>
          </div>
        )}
        <main className="w-full flex-1 p-4 md:p-8 max-w-none md:max-w-2xl md:mx-auto pb-16 md:pb-8">
          {!hydrated ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-500 dark:text-gray-400 text-lg">Loading…</span>
            </div>
          ) : loading && !user ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-500 dark:text-gray-400 text-lg">Loading user…</span>
            </div>
          ) : (
            <>
              {/*<h1 className="text-3xl font-serif font-bold mb-4" style={{ fontFamily: 'Libre Baskerville, serif' }}>Settings</h1>*/}
              
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
              {/*section === 'data' && <DataSection user={user ?? undefined} />*/}
              {section === 'messages' && <MessagesSection />}
              {/*section === 'notifications' && <NotificationsSection user={user ?? undefined} />*/}
              {section === 'premium' && <PremiumSection user={user ?? undefined} />}
              {section === 'danger' && <DangerZoneSection user={user ?? undefined} />}
            </>
          )}
        </main>
        {/* SaveBar removed; explicit Edit/Save controls are used */}
      </div>
    </div>
  );
}

