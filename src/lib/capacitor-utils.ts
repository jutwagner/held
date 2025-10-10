import { Capacitor } from '@capacitor/core';

export interface PlatformInfo {
  isCapacitor: boolean;
  isNative: boolean;
  platform: 'web' | 'ios' | 'android';
  isUS: boolean;
}

export function getPlatformInfo(): PlatformInfo {
  const isCapacitor = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';
  
  // Detect if user is in US (you might want to make this more sophisticated)
  const isUS = typeof navigator !== 'undefined' && 
    (navigator.language === 'en-US' || 
     navigator.languages?.includes('en-US') ||
     Intl.DateTimeFormat().resolvedOptions().timeZone?.includes('America'));

  return {
    isCapacitor,
    isNative: isCapacitor,
    platform,
    isUS
  };
}

export function shouldUseCapacitorPayments(): boolean {
  const { isCapacitor } = getPlatformInfo();
  return isCapacitor;
}

export function getPaymentMethod(): 'stripe' | 'storekit' | 'web' {
  const { isCapacitor, isUS } = getPlatformInfo();
  
  if (!isCapacitor) {
    return 'web'; // Use existing web payment flow
  }
  
  return isUS ? 'stripe' : 'storekit';
}

