// StoreKit utilities for iOS In-App Purchases
import { Subscriptions } from '@squareetlabs/capacitor-subscriptions';

export interface StoreKitProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceLocale: string;
}

export interface StoreKitPurchase {
  productId: string;
  transactionId: string;
  receipt: string;
}

// Real StoreKit implementation using @squareetlabs/capacitor-subscriptions
export const StoreKitUtils = {
  async getProducts(): Promise<StoreKitProduct[]> {
    try {
      const impl: any = Subscriptions as any;
      if (!impl?.getProducts) {
        console.warn('[StoreKitUtils] getProducts not available on Subscriptions plugin');
        return [];
      }
      const result = await impl.getProducts({
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
      const impl: any = Subscriptions as any;
      if (!impl?.purchaseProduct) {
        console.warn('[StoreKitUtils] purchaseProduct not available on Subscriptions plugin');
        return null;
      }
      const result = await impl.purchaseProduct({
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
      const impl: any = Subscriptions as any;
      if (!impl?.restorePurchases) {
        console.warn('[StoreKitUtils] restorePurchases not available on Subscriptions plugin');
        return [];
      }
      const result = await impl.restorePurchases();
      
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
