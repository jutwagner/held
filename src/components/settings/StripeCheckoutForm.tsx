import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function StripeCheckoutForm({ onSuccess }: { onSuccess?: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!stripe || !elements) {
      setError('Stripe not loaded');
      setLoading(false);
      return;
    }
    // Call your backend to create a PaymentIntent and get clientSecret
    const res = await fetch('/api/create-payment-intent', { method: 'POST' });
    const { clientSecret } = await res.json();
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });
    if (result.error) {
      setError(result.error.message || 'Payment failed');
    } else if (result.paymentIntent?.status === 'succeeded') {
      setSuccess(true);
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  return (
    <div>
      {success ? (
        <div className="text-blue-700 text-lg font-semibold text-center mb-4">
          Thank you. Held+ is now active on your account.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-transparent p-0 flex flex-col gap-6"
        >
          <div className="mb-2">
            <label className="block text-lg font-semibold mb-2 text-gray-900">Credit Card</label>
            <div className="border border-gray-300 rounded-lg px-3 py-4 bg-white font-mono">
              <CardElement options={{ hidePostalCode: true, style: { base: { fontFamily: 'monospace' } } }} />
            </div>
          </div>
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          <button
            type="submit"
            className="bg-black text-white px-6 py-3 rounded-xl font-bold text-base hover:scale-[1.03] active:scale-95 transition w-full"
            disabled={loading}
          >
            {loading ? 'Processing…' : 'Join Held+'}
          </button>
          <div className="text-xs text-gray-400 text-center mt-2">Secured by Stripe</div>
        </form>
      )}
    </div>
  );
}
