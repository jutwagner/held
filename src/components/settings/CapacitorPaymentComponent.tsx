import React, { useState, useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { getPaymentMethod, getPlatformInfo } from '@/lib/capacitor-utils';
import { StoreKitUtils } from '@/lib/storekit-utils';
import { UserDoc } from '@/types';

interface CapacitorPaymentComponentProps {
  user?: UserDoc;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function CapacitorPaymentComponent({ 
  user, 
  onSuccess, 
  onError 
}: CapacitorPaymentComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [platformInfo, setPlatformInfo] = useState(getPlatformInfo());

  useEffect(() => {
    setPlatformInfo(getPlatformInfo());
  }, []);

  const handleUSPayment = async () => {
    if (!user?.uid) {
      onError?.('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user.uid,
          email: user.email,
          returnUrl: `${window.location.origin}/settings/premium?payment=success`
        }),
      });

      const data = await response.json();
      
      if (!data.url) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Open Stripe checkout in Safari
      await Browser.open({ 
        url: data.url,
        windowName: '_self'
      });

      // Start polling for payment completion
      pollForPaymentCompletion(user.uid);
      
    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error instanceof Error ? error.message : 'Payment failed');
      setIsLoading(false);
    }
  };

  const handleNonUSPayment = async () => {
    setIsLoading(true);
    try {
      // For non-US users, we'll use StoreKit IAP
      const products = await StoreKitUtils.getProducts();
      const heldPlusProduct = products.find(p => p.productId === 'com.held.app.heldplus');
      
      if (!heldPlusProduct) {
        throw new Error('Held+ product not found in App Store');
      }

      const purchase = await StoreKitUtils.purchaseProduct(heldPlusProduct.productId);
      
      if (purchase) {
        // Verify the purchase with your backend
        const response = await fetch('/api/verify-storekit-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user?.uid,
            productId: purchase.productId,
            transactionId: purchase.transactionId,
            receipt: purchase.receipt
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          onSuccess?.();
        } else {
          throw new Error(data.error || 'Purchase verification failed');
        }
      } else {
        throw new Error('Purchase was cancelled or failed');
      }
    } catch (error) {
      console.error('StoreKit error:', error);
      onError?.(error instanceof Error ? error.message : 'StoreKit payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const pollForPaymentCompletion = async (uid: string) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/check-payment-status?uid=${uid}`);
        const data = await response.json();
        
        if (data.success) {
          onSuccess?.();
          setIsLoading(false);
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          onError?.('Payment verification timeout');
          setIsLoading(false);
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          onError?.('Payment verification failed');
          setIsLoading(false);
        }
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 5000);
  };

  const handleRestorePurchase = async () => {
    setIsRestoring(true);
    try {
      if (platformInfo.isUS) {
        // For US users, restore through Stripe
        const response = await fetch('/api/restore-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            uid: user?.uid,
            email: user?.email 
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          onSuccess?.();
        } else {
          onError?.(data.error || 'No purchases found to restore');
        }
      } else {
        // For non-US users, restore through StoreKit
        const purchases = await StoreKitUtils.restorePurchases();
        const heldPlusPurchase = purchases.find(p => p.productId === 'com.held.app.heldplus');
        
        if (heldPlusPurchase) {
          // Verify the restored purchase
          const response = await fetch('/api/verify-storekit-purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user?.uid,
              productId: heldPlusPurchase.productId,
              transactionId: heldPlusPurchase.transactionId,
              receipt: heldPlusPurchase.receipt
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            onSuccess?.();
          } else {
            onError?.(data.error || 'Purchase verification failed');
          }
        } else {
          onError?.('No purchases found to restore');
        }
      }
    } catch (error) {
      console.error('Restore error:', error);
      onError?.(error instanceof Error ? error.message : 'Restore failed');
    } finally {
      setIsRestoring(false);
    }
  };

  const paymentMethod = getPaymentMethod();

  if (paymentMethod === 'web') {
    // Fall back to regular web payment flow
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Upgrade to Held+
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {platformInfo.isUS 
            ? 'Complete your purchase securely with Stripe'
            : 'Purchase through the App Store'
          }
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={platformInfo.isUS ? handleUSPayment : handleNonUSPayment}
          disabled={isLoading}
          className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : (
            `Upgrade to Held+ - ${platformInfo.isUS ? 'Stripe Checkout' : 'App Store'}`
          )}
        </button>

        <button
          onClick={handleRestorePurchase}
          disabled={isRestoring}
          className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRestoring ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              Restoring...
            </div>
          ) : (
            'Restore Purchase / Sign In'
          )}
        </button>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {platformInfo.isUS 
          ? 'Payment processed securely by Stripe'
          : 'Payment processed by Apple App Store'
        }
      </div>
    </div>
  );
}
