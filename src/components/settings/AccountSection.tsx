import React from 'react';
import { UserDoc } from '@/types';

export default function AccountSection({ user }: { user?: UserDoc }) {
  return (
    <section aria-labelledby="account-header" className="mb-8">
      <h2 id="account-header" className="font-serif text-xl mb-4">Account & Security</h2>
      <div className="mb-4">
        {user ? (
          <>
            <div className="text-sm text-gray-600">Email: {user.email}</div>
            <div className="text-sm text-gray-600">Providers: {user.security?.providers?.join(', ')}</div>
          </>
        ) : (
          <div className="text-gray-400 text-sm">Loading account…</div>
        )}
      </div>
      {/* TODO: Change password, sessions list, revoke session */}
      <div className="text-xs text-gray-400">Change password, sessions, and revoke session coming soon.</div>
    </section>
  );
}
