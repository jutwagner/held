'use client';

import Navigation from '@/components/Navigation';
import LiveFeed from '@/components/LiveFeed';
import Badge from '@/components/Badge';
import Toast from '@/components/Toast';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import playSound from '@/components/SoundEffects';
import '@/styles/themes.css';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState({
    displayName: 'John Doe',
    accountName: 'johndoe123',
    email: 'johndoe@example.com',
    notifications: true,
    darkMode: false,
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const themes = ['light', 'dark', 'colorful'];
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const applyTheme = (theme: string) => {
    setSelectedTheme(theme);
    localStorage.setItem('theme', theme);
    document.documentElement.classList.remove('light', 'dark', 'colorful');
    document.documentElement.classList.add(theme);
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      <div className="held-container py-8">
        <h1 className="text-3xl font-serif font-medium mb-4">Settings</h1>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{getGreeting()}, {preferences.displayName}!</h2>
          <p className="text-gray-600">Here’s what you can do today:</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <p className="text-gray-900">{preferences.displayName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
            <p className="text-gray-900">{preferences.accountName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{preferences.email}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Notifications</span>
            <button
              onClick={() => {
                handleToggle('notifications');
                showToast('Notifications setting updated!');
                playSound('/sounds/click.mp3');
              }}
              className={`px-4 py-2 rounded ${preferences.notifications ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
            >
              {preferences.notifications ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span>Dark Mode</span>
            <button onClick={toggleTheme} className="px-4 py-2 bg-gray-200 rounded-md">
              {isDarkMode ? 'Disable' : 'Enable'}
            </button>
          </div>
          <div className="mt-4">
            <h2 className="text-lg font-medium">Choose Theme</h2>
            <div className="flex space-x-4 mt-2">
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => applyTheme(theme)}
                  className={`px-4 py-2 rounded ${selectedTheme === theme ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
        <div className="mt-8">
          <h2 className="text-lg font-medium">Achievements</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Badge label="Profile Complete" description="You completed your profile!" />
            <Badge label="Dark Mode Explorer" description="You enabled dark mode!" />
          </div>
        </div>
        <div className="mt-8">
          <LiveFeed />
        </div>
        <div className="mt-8">
          <h2 className="text-lg font-medium">Avatar</h2>
          <div className="flex items-center space-x-4 mt-4">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
            )}
            <label className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer">
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
        </div>
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </div>
    </div>
  );
}
