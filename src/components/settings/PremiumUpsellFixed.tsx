import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripeCheckoutForm from './StripeCheckoutForm';
import { UserDoc } from '../../types';

interface PremiumUpsellProps {
  user?: UserDoc;
  showCheckoutForm?: boolean;
  onSuccess?: () => void;
}

export default function PremiumUpsellFixed({ user, showCheckoutForm, onSuccess }: PremiumUpsellProps) {
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  return (
    <div className="mb-4">
      {/* Only show Stripe Elements form if triggered by parent */}
      {showCheckoutForm ? (
        <Elements stripe={stripePromise}>
          <StripeCheckoutForm uid={user?.uid} email={user?.email} onSuccess={onSuccess} />
        </Elements>
      ) : null}
    </div>
  );
}
