import Foundation
import Capacitor
import WebKit

@objc(HeldNativePlugin)
public class HeldNativePlugin: CAPPlugin {
    
    @objc func configureWebView(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let webView = self.bridge?.webView else {
                call.reject("WebView not available")
                return
            }
            
            // Configure webview for native iOS experience
            webView.scrollView.contentInsetAdjustmentBehavior = .never
            webView.scrollView.automaticallyAdjustsScrollIndicatorInsets = false
            
            // Force safe area insets
            let safeAreaTop = webView.safeAreaInsets.top
            let dynamicIslandPadding: CGFloat = safeAreaTop > 47 ? 60 : 44
            
            webView.scrollView.contentInset = UIEdgeInsets(
                top: dynamicIslandPadding, 
                left: 0, 
                bottom: 0, 
                right: 0
            )
            
            // Inject CSS to remove Safari UI
            let cssScript = """
                var style = document.createElement('style');
                style.innerHTML = `
                    input, textarea, select {
                        -webkit-appearance: none !important;
                        appearance: none !important;
                        outline: none !important;
                        border: 1px solid #d1d5db !important;
                        border-radius: 8px !important;
                        background: rgba(255, 255, 255, 0.9) !important;
                        font-size: 16px !important;
                        -webkit-tap-highlight-color: transparent !important;
                    }
                    
                    input::-webkit-contacts-auto-fill-button,
                    input::-webkit-credentials-auto-fill-button,
                    input::-webkit-caps-lock-indicator,
                    input::-webkit-clear-button {
                        display: none !important;
                        visibility: hidden !important;
                    }
                `;
                document.head.appendChild(style);
                
                // Remove Safari UI continuously
                setInterval(function() {
                    document.querySelectorAll('input, textarea, select').forEach(function(input) {
                        input.style.webkitAppearance = 'none';
                        input.style.outline = 'none';
                        input.style.fontSize = '16px';
                    });
                }, 500);
            """
            
            webView.evaluateJavaScript(cssScript) { (result, error) in
                if let error = error {
                    print("❌ Failed to inject CSS: \\(error)")
                } else {
                    print("✅ CSS injected successfully")
                }
            }
            
            call.resolve(["success": true, "safeAreaTop": safeAreaTop, "appliedPadding": dynamicIslandPadding])
        }
    }
}
