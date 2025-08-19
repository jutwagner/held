"use client";
import React from 'react';
import SettingsPage from './SettingsPage';

export default function SettingsClient(props: React.ComponentProps<typeof SettingsPage>) {
  return <SettingsPage {...props} />;
}
