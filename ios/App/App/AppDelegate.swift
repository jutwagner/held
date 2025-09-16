import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        
        // Configure webview to disable Safari behaviors
        if #available(iOS 14.0, *) {
            let config = WKWebViewConfiguration()
            
            // Disable Safari-like behaviors
            config.allowsInlineMediaPlayback = true
            config.mediaTypesRequiringUserActionForPlayback = []
            config.suppressesIncrementalRendering = false
            
            // Configure user content controller to inject CSS
            let userContentController = WKUserContentController()
            
            let cssString = """
                /* Force remove Safari input styling */
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
                
                /* Hide all Safari input decorations */
                input::-webkit-contacts-auto-fill-button,
                input::-webkit-credentials-auto-fill-button,
                input::-webkit-caps-lock-indicator,
                input::-webkit-clear-button,
                input::-webkit-inner-spin-button,
                input::-webkit-outer-spin-button {
                    display: none !important;
                    visibility: hidden !important;
                }
                
                /* Force safe area for Dynamic Island */
                body {
                    padding-top: max(env(safe-area-inset-top), 44px) !important;
                }
            """
            
            let cssScript = WKUserScript(source: """
                var style = document.createElement('style');
                style.innerHTML = `\(cssString)`;
                document.head.appendChild(style);
                
                // Force remove Safari UI on all inputs
                function removeSafariUI() {
                    var inputs = document.querySelectorAll('input, textarea, select');
                    inputs.forEach(function(input) {
                        input.style.webkitAppearance = 'none';
                        input.style.appearance = 'none';
                        input.style.outline = 'none';
                        input.style.fontSize = '16px';
                        input.style.webkitTapHighlightColor = 'transparent';
                    });
                }
                
                removeSafariUI();
                document.addEventListener('DOMContentLoaded', removeSafariUI);
                document.addEventListener('input', removeSafariUI);
                setInterval(removeSafariUI, 1000);
            """, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
            
            userContentController.addUserScript(cssScript)
            config.userContentController = userContentController
        }
        
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
