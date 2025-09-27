'use client';

import { useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

const DONATION_AMOUNTS = [0.50, 1, 5, 10, 20, 50];

interface DonateFormProps {
  amount: number;
  onProcessingChange?: (processing: boolean) => void;
  onSuccess?: () => void;
}

export default function DonateForm({ amount, onProcessingChange, onSuccess }: DonateFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please wait a moment.');
      return;
    }

    setProcessing(true);
    setError(null);
    onProcessingChange?.(true);

    try {
      const response = await fetch('/api/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, email: email || undefined }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to start donation.');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card information is incomplete.');
      }

      const confirmation = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: email ? { email } : undefined,
        },
      });

      if (confirmation.error) {
        throw new Error(confirmation.error.message || 'Payment failed.');
      }

      if (confirmation.paymentIntent?.status === 'succeeded') {
        setSuccess(true);
        onSuccess?.();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
      onProcessingChange?.(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Thank you!</h2>
        <p>Your ${amount.toFixed(2)} donation helps us keep Held thriving.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Optional email for receipt
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Card details
        </label>
        <div className="rounded-lg border border-gray-300 bg-white px-3 py-4">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={processing || !stripe}
        className="w-full rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing ? 'Processing…' : `Donate $${amount}`}
      </button>

      <p className="text-xs text-gray-400 text-center">Secure payments processed by Stripe.</p>
    </form>
  );
}

export function AmountPicker({
  selectedAmount,
  onSelect,
  disabled = false,
}: {
  selectedAmount: number;
  onSelect: (amount: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 grid-cols-5 gap-3">
      {DONATION_AMOUNTS.map((donationAmount) => {
        const isActive = selectedAmount === donationAmount;
        return (
          <button
            key={donationAmount}
            type="button"
            onClick={() => !disabled && onSelect(donationAmount)}
            disabled={disabled}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? 'border-black bg-black text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-black/60'
            }`}
          >
            ${donationAmount}
          </button>
        );
      })}
    </div>
  );
}
