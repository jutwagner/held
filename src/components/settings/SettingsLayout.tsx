"use client";
import React from 'react';
import type { SectionKey } from './SectionNav';
import SettingsTopNav from './SettingsTopNav';

interface SettingsLayoutProps {
  section: SectionKey;
  children: React.ReactNode;
}

export default function SettingsLayout({ section, children }: SettingsLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <SettingsTopNav section={section} />
      <main className="w-full flex-1 p-4 md:p-8 max-w-none md:max-w-6xl md:mx-auto pb-16 md:pb-8">
        {children}
      </main>
    </div>
  );
}
