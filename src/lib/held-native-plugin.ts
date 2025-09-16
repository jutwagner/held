import { registerPlugin } from '@capacitor/core';

export interface HeldNativePlugin {
  configureWebView(): Promise<{ success: boolean; safeAreaTop: number; appliedPadding: number }>;
}

const HeldNative = registerPlugin<HeldNativePlugin>('HeldNativePlugin');

export default HeldNative;
