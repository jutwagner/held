import React from 'react';
import PremiumUpsell from './PremiumUpsell';
import { UserDoc } from '@/types';

export default function PremiumSection({ user }: { user?: UserDoc }) {
  return (
    <section aria-labelledby="heldplus-header" className="mb-8">
      <h2 id="heldplus-header" className="font-serif text-xl mb-4">Held+</h2>
      {user ? (
        user.premium.active ? (
          <div className="bg-gray-100 rounded p-4 mb-4">
            <div className="font-semibold">Plan: {user.premium.plan}</div>
            <div className="text-sm text-gray-600">Since: {user.premium.since ? new Date(user.premium.since).toLocaleDateString() : '-'}</div>
            <div className="text-sm text-gray-600">Renews: {user.premium.renewsAt ? new Date(user.premium.renewsAt).toLocaleDateString() : '-'}</div>
            <button className="mt-2 px-4 py-2 bg-gray-900 text-white rounded" onClick={() => {/* TODO: Stripe portal */}}>Manage billing</button>
          </div>
        ) : (
          <PremiumUpsell />
        )
      ) : (
        <div className="text-gray-400 text-sm">Loading premium…</div>
      )}
    </section>
  );
}
