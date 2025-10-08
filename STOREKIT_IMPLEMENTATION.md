# StoreKit Implementation Guide for Held+

This guide explains how to implement Apple StoreKit In-App Purchases for the Held+ subscription in your Capacitor iOS app.

## Overview

The payment system is designed to be Apple App Store compliant:
- **US Users**: Use Stripe Checkout in Safari
- **Non-US Users**: Use StoreKit In-App Purchases
- **All Users**: Can restore purchases and sign in

## Current Implementation Status

✅ **Completed:**
- Capacitor detection utility
- Platform-specific payment routing
- Stripe Checkout for US users
- API endpoints for payment verification
- Restore purchase functionality
- UI components for both payment methods

⚠️ **Needs Implementation:**
- Actual StoreKit plugin integration
- App Store Connect product configuration
- Receipt verification with Apple's servers

## Required Setup

### 1. Install StoreKit Plugin

```bash
npm install @squareetlabs/capacitor-subscriptions
npx cap sync
```

### 2. Configure iOS Project

Add to your `ios/App/App/capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ... existing config
  plugins: {
    InAppPurchases: {
      // Add any plugin-specific configuration here
    }
  }
};
```

### 3. App Store Connect Setup

1. **Create In-App Purchase Product:**
   - Product ID: `com.held.app.heldplus`
   - Type: Auto-Renewable Subscription
   - Duration: 1 Month
   - Price: Set according to your pricing strategy

2. **Configure Subscription Groups:**
   - Create a subscription group for Held+
   - Add your product to the group

### 4. Update StoreKit Utils

The StoreKit utils are already implemented in `src/lib/storekit-utils.ts` using the `@squareetlabs/capacitor-subscriptions` plugin:

```typescript
import { CapacitorSubscriptions } from '@squareetlabs/capacitor-subscriptions';

export const StoreKitUtils = {
  async getProducts(): Promise<StoreKitProduct[]> {
    try {
      const result = await CapacitorSubscriptions.getProducts({
        productIds: ['com.held.app.heldplus']
      });
      
      return result.products.map(product => ({
        productId: product.productId,
        title: product.title,
        description: product.description,
        price: product.price,
        priceLocale: product.priceLocale
      }));
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  },

  async purchaseProduct(productId: string): Promise<StoreKitPurchase | null> {
    try {
      const result = await CapacitorSubscriptions.purchaseProduct({
        productId: productId
      });
      
      if (result.purchase) {
        return {
          productId: result.purchase.productId,
          transactionId: result.purchase.transactionId,
          receipt: result.purchase.receipt
        };
      }
      return null;
    } catch (error) {
      console.error('Error purchasing product:', error);
      return null;
    }
  },

  async restorePurchases(): Promise<StoreKitPurchase[]> {
    try {
      const result = await CapacitorSubscriptions.restorePurchases();
      
      return result.purchases.map(purchase => ({
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        receipt: purchase.receipt
      }));
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return [];
    }
  },

  async verifyReceipt(receipt: string): Promise<boolean> {
    // Implement server-side receipt verification
    try {
      const response = await fetch('/api/verify-apple-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt })
      });
      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Error verifying receipt:', error);
      return false;
    }
  }
};
```

### 5. Server-Side Receipt Verification

Create `src/app/api/verify-apple-receipt/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { receipt } = await req.json();
    
    // Verify with Apple's servers
    const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receipt,
        'password': process.env.APPLE_SHARED_SECRET, // From App Store Connect
        'exclude-old-transactions': true
      })
    });
    
    const data = await response.json();
    
    if (data.status === 0) {
      // Valid receipt
      return NextResponse.json({ valid: true, data });
    } else {
      // Invalid receipt
      return NextResponse.json({ valid: false, error: data.status });
    }
  } catch (error) {
    console.error('Receipt verification error:', error);
    return NextResponse.json({ valid: false, error: 'Verification failed' });
  }
}
```

## Testing

### 1. Sandbox Testing

1. Create sandbox test accounts in App Store Connect
2. Sign out of App Store on your test device
3. Use sandbox account to test purchases
4. Verify purchases are properly recorded in your database

### 2. Production Testing

1. Submit app for review with StoreKit integration
2. Test with real App Store accounts
3. Verify subscription management works correctly

## Environment Variables

Add to your `.env.local`:

```bash
# Apple App Store
APPLE_SHARED_SECRET=your_shared_secret_from_app_store_connect

# Stripe (for US users)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## User Experience Flow

### US Users (Stripe):
1. Click "Upgrade to Held+"
2. Opens Stripe Checkout in Safari
3. Complete payment
4. Return to app with active subscription
5. Can restore purchases through web account

### Non-US Users (StoreKit):
1. Click "Upgrade to Held+"
2. Native iOS purchase dialog appears
3. Complete purchase with Touch ID/Face ID
4. Subscription immediately active
5. Can restore purchases through "Restore Purchase" button

## Troubleshooting

### Common Issues:

1. **Products not loading**: Check product IDs match App Store Connect
2. **Purchase fails**: Verify sandbox account is properly configured
3. **Receipt verification fails**: Check Apple Shared Secret is correct
4. **Restore not working**: Ensure purchases are properly stored in database

### Debug Steps:

1. Check console logs for StoreKit errors
2. Verify App Store Connect configuration
3. Test with different sandbox accounts
4. Verify receipt format and validation

## Security Considerations

1. **Never trust client-side receipt validation**
2. **Always verify receipts server-side**
3. **Store transaction IDs to prevent duplicate processing**
4. **Implement proper error handling and logging**
5. **Use HTTPS for all API communications**

## Next Steps

1. Install the StoreKit plugin
2. Configure App Store Connect products
3. Update the StoreKit utils with real implementation
4. Test thoroughly in sandbox environment
5. Submit for App Store review

## Support

For issues with StoreKit implementation:
- Check Apple's StoreKit documentation
- Review Capacitor Community In-App Purchases plugin docs
- Test with Apple's sandbox environment
- Verify App Store Connect configuration
