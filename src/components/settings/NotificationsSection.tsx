import React from 'react';
import ToggleRow from './ToggleRow';
import { UserDoc } from '@/types';

export default function NotificationsSection({ user }: { user?: UserDoc }) {
  const notifications = user?.notifications ?? {
    monthlyRotation: false,
    quarterlyReview: false,
    email: false,
    push: false,
  };
  return (
    <section aria-labelledby="notifications-header" className="mb-8">
      {/* @ts-ignore
      <h2 id="notifications-header" className="font-serif text-xl mb-4 text-gray-900 dark:text-gray-100">Notifications</h2>
      <div>
        {user ? (
          <>
            <ToggleRow label="Monthly Refresh Rotation" checked={notifications.monthlyRotation} onChange={() => {}} />
            <ToggleRow label="Quarterly Review Registry" checked={notifications.quarterlyReview} onChange={() => {}} />
            <ToggleRow label="Email" checked={notifications.email} onChange={() => {}} />
            <ToggleRow label="Push" checked={notifications.push} onChange={() => {}} />
          </>
        ) : (
          <div className="text-gray-400 dark:text-gray-500 text-sm">Loading notifications…</div>
        )}
      </div>
      <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">Push channel is stub UI for now.</div>
       */}
    </section>
  );
}
