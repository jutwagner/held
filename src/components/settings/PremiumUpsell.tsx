import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripeCheckoutForm from './StripeCheckoutForm';

export default function PremiumUpsell() {
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  return (
    <div className="mb-4">
      <div className="font-bold text-2xl mb-2 text-gray-900 tracking-tight">
        Held+ Membership
      </div>
      <div className="text-base text-gray-700 mb-4 font-medium">
        Experience Held at its highest level. Unlock advanced tools, refined design, and exclusive features crafted for those who expect more.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col">
          <div className="font-semibold text-gray-900 mb-1">Unlimited Rotations</div>
          <div className="text-xs text-gray-500">Expand without boundaries.</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col">
          <div className="font-semibold text-gray-900 mb-1">Multiple Passport Images</div>
          <div className="text-xs text-gray-500">Express your identity with clarity.</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col">
          <div className="font-semibold text-gray-900 mb-1">Vanity URLs</div>
          <div className="text-xs text-gray-500">Your presence, distinctly yours.</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col">
          <div className="font-semibold text-gray-900 mb-1">Saved Filters & Advanced Search</div>
          <div className="text-xs text-gray-500">Precision at your fingertips.</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col">
          <div className="font-semibold text-gray-900 mb-1">Exports & Encrypted Backups</div>
          <div className="text-xs text-gray-500">Security and control, always.</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col">
          <div className="font-semibold text-gray-900 mb-1">Themes & Layouts</div>
          <div className="text-xs text-gray-500">A workspace that reflects you.</div>
        </div>
      </div>
      <Elements stripe={stripePromise}>
        <StripeCheckoutForm />
      </Elements>
    </div>
  );
}
