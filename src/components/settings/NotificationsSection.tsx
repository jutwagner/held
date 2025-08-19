import React from 'react';
import ToggleRow from './ToggleRow';
import { UserDoc } from '@/types';

export default function NotificationsSection({ user }: { user?: UserDoc }) {
  return (
    <section aria-labelledby="notifications-header" className="mb-8">
      <h2 id="notifications-header" className="font-serif text-xl mb-4">Notifications</h2>
      <div>
        {user ? (
          <>
            <ToggleRow label="Monthly Refresh Rotation" checked={user.notifications.monthlyRotation} onChange={() => {}} />
            <ToggleRow label="Quarterly Review Registry" checked={user.notifications.quarterlyReview} onChange={() => {}} />
            <ToggleRow label="Email" checked={user.notifications.email} onChange={() => {}} />
            <ToggleRow label="Push" checked={user.notifications.push} onChange={() => {}} />
          </>
        ) : (
          <div className="text-gray-400 text-sm">Loading notifications…</div>
        )}
      </div>
      <div className="mt-4 text-xs text-gray-400">Push channel is stub UI for now.</div>
    </section>
  );
}
