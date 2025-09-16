'use client';

import { useEffect } from 'react';

export default function IOSNativeHandler() {
  useEffect(() => {
    const initializeIOSNative = async () => {
      if (typeof window !== 'undefined') {
        const isCapacitor = !!(window as any).Capacitor;
        
        if (isCapacitor) {
          console.log('🍎 Initializing native iOS controls...');
          
          try {
            // Import Capacitor plugins
            const { StatusBar } = await import('@capacitor/status-bar');
            const { Keyboard } = await import('@capacitor/keyboard');
            
            // Configure status bar to not overlay
            await StatusBar.setOverlaysWebView({ overlay: false });
            await StatusBar.setStyle({ style: 'DARK' });
            
            console.log('✅ Status bar configured - no overlay');
            
            // Configure keyboard to hide accessory bar
            await Keyboard.setAccessoryBarVisible({ isVisible: false });
            
            console.log('✅ Keyboard accessory bar hidden');
            
            // Force remove all Safari UI with more aggressive approach
            const removeAllSafariUI = () => {
              // Get all input elements
              const inputs = document.querySelectorAll('input, textarea, select');
              
              inputs.forEach((input: any) => {
                // Remove all webkit styling
                input.style.webkitAppearance = 'none';
                input.style.appearance = 'none';
                input.style.outline = 'none';
                input.style.border = '1px solid #d1d5db';
                input.style.borderRadius = '8px';
                input.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                input.style.fontSize = '16px';
                input.style.webkitTapHighlightColor = 'transparent';
                input.style.boxShadow = 'none';
                
                // Remove all webkit pseudo-elements
                const styleSheet = document.createElement('style');
                styleSheet.textContent = `
                  input::-webkit-contacts-auto-fill-button,
                  input::-webkit-credentials-auto-fill-button,
                  input::-webkit-caps-lock-indicator,
                  input::-webkit-clear-button,
                  input::-webkit-inner-spin-button,
                  input::-webkit-outer-spin-button,
                  input::-webkit-search-cancel-button,
                  input::-webkit-search-decoration,
                  input::-webkit-textfield-decoration-container {
                    display: none !important;
                    visibility: hidden !important;
                    -webkit-appearance: none !important;
                  }
                `;
                if (!document.head.querySelector('#ios-input-override')) {
                  styleSheet.id = 'ios-input-override';
                  document.head.appendChild(styleSheet);
                }
                
                // Add event listeners to prevent Safari UI
                input.addEventListener('focus', (e: any) => {
                  e.target.style.webkitAppearance = 'none';
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = 'none';
                });
                
                input.addEventListener('blur', (e: any) => {
                  e.target.style.webkitAppearance = 'none';
                });
              });
            };
            
            // Run immediately and watch for new inputs
            removeAllSafariUI();
            
            const observer = new MutationObserver(() => {
              setTimeout(removeAllSafariUI, 100);
            });
            
            observer.observe(document.body, { 
              childList: true, 
              subtree: true,
              attributes: true,
              attributeFilter: ['class', 'style']
            });
            
            // Also run on route changes
            let lastUrl = location.href;
            new MutationObserver(() => {
              const url = location.href;
              if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(removeAllSafariUI, 500);
              }
            }).observe(document, { subtree: true, childList: true });
            
          } catch (error) {
            console.error('❌ Failed to initialize native iOS controls:', error);
          }
        }
      }
    };
    
    initializeIOSNative();
  }, []);

  return null; // This component doesn't render anything
}
