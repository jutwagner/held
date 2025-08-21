import React from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import PremiumUpsell from './PremiumUpsell';
import { UserDoc } from '@/types';
import UpdatePaymentForm from './UpdatePaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import InvoiceHistory from './InvoiceHistory';

export default function PremiumSection({ user }: { user?: UserDoc }) {
  // Hydration guard: only show client-only status after hydration
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => { setHydrated(true); }, []);
  // Force UI to show 'Active' for a few seconds after re-subscribe
  const [forceActive, setForceActive] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [cancelSuccess, setCancelSuccess] = React.useState(false);
  const [showUpdatePaymentDialog, setShowUpdatePaymentDialog] = React.useState(false);
  const [updateLoading, setUpdateLoading] = React.useState(false);
  const [updateSuccess, setUpdateSuccess] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const handleCancel = async () => {
    setCancelLoading(true);
    // Optimistically update localUser for instant UI feedback
    setLocalUser(prev => prev ? {
      ...prev,
      premium: {
        ...prev.premium,
        cancelRequested: true,
        active: false,
      },
    } : prev);
    try {
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user?.uid }),
      });
      const data = await res.json();
      if (data.success) {
        setCancelSuccess(true);
        setShowCancelDialog(false);
      } else {
        alert(data.error || 'Unable to cancel subscription.');
      }
    } catch {
      alert('Unable to cancel subscription.');
    }
    setCancelLoading(false);
  };
  // Helper to update UI after payment without full reload
  // Only show card form after clicking Re-Subscribe or if not active
  const [showCardForm, setShowCardForm] = React.useState(false);
  const [localUser, setLocalUser] = React.useState<UserDoc | undefined>(user);
  React.useEffect(() => {
    setLocalUser(user);
    if (!user?.uid) return;
    // Listen for Firestore changes to this user
    // Use 'unknown' for window and doc, then typecast as needed
    const heldFirebase = (window as unknown as { heldFirebase?: unknown }).heldFirebase;
    const unsubscribe = heldFirebase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (heldFirebase as any).firestore().collection('users').doc(user.uid)
          .onSnapshot((doc: DocumentSnapshot) => {
            setLocalUser(doc.data() as UserDoc);
          })
      : null;
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  const handleUpgradeSuccess = () => {
    setLocalUser(prev => prev ? {
      ...prev,
      premium: {
        ...prev.premium,
        active: true,
        cancelRequested: false,
      },
    } : prev);
    setForceActive(true);
    setShowCardForm(false);
    setTimeout(() => {
      setForceActive(false);
    }, 5000);
  };
  // Helper to check if expired
  const isExpired = user?.premium.renewsAt && user.premium.renewsAt < Date.now();
  const isActive = user?.premium.active && !isExpired;
    // SSR-safe date formatting
    const formatDate = (timestamp?: number | string) => {
      if (!timestamp) return '-';
      const date = new Date(Number(timestamp));
      // Use YYYY-MM-DD for SSR safety
      return date.toISOString().slice(0, 10);
    };

  return (
    <section aria-labelledby="heldplus-header" className="mb-8">
      <div className="bg-gray-100 rounded-xl p-6 shadow mb-4">
        <h2 id="heldplus-header" className="font-serif text-2xl mb-4 flex items-center gap-2">
          Held+
          {hydrated ? (
            forceActive ? (
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 ml-2">Active</span>
            ) : localUser?.premium.active && localUser?.premium.cancelRequested ? (
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 ml-2">
                Active Until {formatDate(localUser?.premium?.renewsAt ?? undefined)}
              </span>
            ) : localUser?.premium.active ? (
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 ml-2">Active</span>
            ) : null
          ) : (
            localUser?.premium.active ? (
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 ml-2">Active</span>
            ) : null
          )}
          {isExpired && !localUser?.premium.active && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 ml-2">Expired</span>
          )}
        </h2>




  <div className="font-semibold mb-1">Plan: {localUser?.premium?.plan}</div>
  <div className="text-sm text-gray-600 mb-1">Since: {formatDate(localUser?.premium?.since ?? undefined)}</div>
  <div className="text-sm text-gray-600 mb-3">Renews: {formatDate(localUser?.premium?.renewsAt ?? undefined)}</div>
        

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

  {localUser?.premium.active && (
          <>
            <div className="flex gap-2 mt-2">
              <button
                className="px-4 py-2 bg-gray-900 text-white rounded"
                onClick={() => setShowUpdatePaymentDialog(true)}
              >
                Update Payment Method
              </button>
              {/*}
              <button
                className="px-4 py-2 bg-gray-900 text-white rounded"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/stripe-portal', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ uid: user?.uid }),
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.open(data.url, '_blank');
                    } else {
                      alert(data.error || 'Unable to open billing portal.');
                    }
                  } catch (err) {
                    alert('Unable to open billing portal.');
                  }
                }}
              >
                Manage billing
              </button>
*/}

              {(forceActive || !localUser?.premium?.cancelRequested) ? (
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelLoading || cancelSuccess}
                >
                  Cancel Held+
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded"
                  onClick={() => setShowCardForm(true)}
                  disabled={cancelLoading || cancelSuccess}
                >
                  Re-Subscribe
                </button>
              )}
            </div>
            {showUpdatePaymentDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                  <div className="font-bold text-lg mb-2">Update Payment Method</div>
                  {/* Stripe Elements provider for UpdatePaymentForm */}
                  {typeof window !== 'undefined' && (
                    <Elements stripe={loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)}>
                      <UpdatePaymentForm
                        uid={user?.uid}
                        onSuccess={() => { setUpdateSuccess(true); setShowUpdatePaymentDialog(false); }}
                        onError={(msg: string) => setUpdateError(msg)}
                        loading={updateLoading}
                        setLoading={setUpdateLoading}
                      />
                    </Elements>
                  )}
                  {updateError && <div className="text-red-600 text-sm mt-2">{updateError}</div>}
                  <button
                    className="mt-4 px-4 py-2 bg-gray-200 rounded"
                    onClick={() => setShowUpdatePaymentDialog(false)}
                    disabled={updateLoading}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            {updateSuccess && (
              <div className="text-green-700 text-sm mt-2">Payment method updated successfully.</div>
            )}
            {showCancelDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                  <div className="font-bold text-lg mb-2">Cancel Held+?</div>
                  <div className="mb-4 text-gray-700">Your premium features will remain until the end of your billing period. Are you sure you want to cancel?</div>
                  <div className="flex gap-2 justify-end">
                    <button
                      className="px-4 py-2 bg-gray-200 rounded"
                      onClick={() => setShowCancelDialog(false)}
                      disabled={cancelLoading}
                    >
                      Keep Held+
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded"
                      onClick={handleCancel}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? 'Cancelling…' : 'Cancel Held+'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {cancelSuccess && (
              <div className="text-red-700 text-sm mt-2">
                Held+ will be cancelled at the end of your billing period.<br />
                {(user?.premium?.plan !== 'plus') && (
                  <span className="text-gray-700">No recurring subscription found. Your premium will simply expire at the end of your billing period.</span>
                )}
              </div>
            )}
          </>
        )}
        {!localUser?.premium.active && showCardForm && (
          <PremiumUpsell user={localUser} showCheckoutForm={showCardForm} onSuccess={handleUpgradeSuccess} />
        )}
        {localUser?.premium.active && localUser?.premium.cancelRequested && showCardForm && (
          <>
            <div className="mt-6">
              <PremiumUpsell user={localUser} showCheckoutForm={showCardForm} onSuccess={handleUpgradeSuccess} />
            </div>
            <PremiumUpsell user={localUser} showCheckoutForm={false} onSuccess={handleUpgradeSuccess} />
          </>
        )}
        {forceActive && (
          <div className="text-blue-700 text-lg font-semibold text-center mb-4">
            Thank you. Held+ is now active on your account.
          </div>
        )}
        <div className="mt-6">
          <InvoiceHistory uid={user?.uid} />
        </div>
      </div>
      {user && !isActive && isExpired && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4 text-red-700 font-semibold text-center">
          Your Held+ subscription has expired. Please renew to continue enjoying premium features.
          <div className="text-sm text-gray-600 mt-2">Expired: {formatDate(user?.premium?.renewsAt ?? undefined)}</div>
        </div>
      )}
      {!user && (
        <div className="text-gray-400 text-sm">Loading premium…</div>
      )}
    </section>
  );
}
