'use client';

import { useMemo, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import DonateForm, { AmountPicker } from '@/components/donate/DonateForm';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [processing, setProcessing] = useState(false);

  const elementsOptions = useMemo(
    () => ({
      appearance: {
        theme: 'flat',
        variables: {
          colorPrimary: '#000000',
        },
      },
    }),
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="held-container held-container-narrow py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-gray-900 dark:text-gray-100 mb-4">
              Support Held
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"> If you’ve found value here, or simply want to see the project continue, your support helps keep it alive.

Every contribution goes directly toward keeping Held online and preserving the objects that pass through it.

            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] items-start">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Select an amount
                </h2>
                <AmountPicker
                  selectedAmount={selectedAmount}
                  onSelect={setSelectedAmount}
                  disabled={processing}
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {stripePromise ? (
                  <Elements stripe={stripePromise} options={elementsOptions}>
                    <DonateForm
                      amount={selectedAmount}
                      onProcessingChange={setProcessing}
                    />
                  </Elements>
                ) : (
                  <div className="text-sm text-red-500">
                    Stripe public key is missing. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
                  </div>
                )}
              </div>
            </div>

            <aside className="rounded-2xl border mt-30 border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Why it matters</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">

                  Donations help fund new features, keep polygon anchoring and servers running, and support the small team building Held.



                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Other ways to help</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Share Held with friends and collectors.</li>
                  <li>Send feedback or ideas to help shape the roadmap.</li>
                </ul>
                <a
                      href="/settings/premium"
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-900 hover:text-white dark:border-gray-100 dark:text-gray-100 dark:hover:bg-gray-100 dark:hover:text-gray-900 mt-5"
                    >
                      Upgrade to Held+
                    </a>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
