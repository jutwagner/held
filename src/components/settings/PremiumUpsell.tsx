
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripeCheckoutForm from './StripeCheckoutForm';
import { UserDoc } from '../../types';

// Only initialize Stripe once
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PremiumUpsellProps {
  user?: UserDoc;
  showCheckoutForm?: boolean;
  onSuccess?: () => void;
}

export default function PremiumUpsell({ user, showCheckoutForm, onSuccess }: PremiumUpsellProps) {
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
