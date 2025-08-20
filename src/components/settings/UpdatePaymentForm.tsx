import React from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface UpdatePaymentFormProps {
  uid?: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const UpdatePaymentForm: React.FC<UpdatePaymentFormProps> = ({ uid, onSuccess, onError, loading, setLoading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!stripe || !elements) {
      setError('Stripe not loaded');
      setLoading(false);
      return;
    }
    // Create payment method
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }
    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });
    if (pmError || !paymentMethod) {
      setError(pmError?.message || 'Unable to create payment method');
      setLoading(false);
      return;
    }
    // Call backend to attach payment method
    const res = await fetch('/api/update-payment-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, paymentMethodId: paymentMethod.id }),
    });
    const data = await res.json();
    if (data.success) {
      onSuccess();
    } else {
      setError(data.error || 'Unable to update payment method');
      onError(data.error || 'Unable to update payment method');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-base font-semibold mb-2 text-gray-900">New Credit Card</label>
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
        {loading ? 'Updating…' : 'Update Payment Method'}
      </button>
      <div className="text-xs text-gray-400 text-center mt-2">Secured by Stripe</div>
    </form>
  );
};

export default UpdatePaymentForm;
