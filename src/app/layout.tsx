import './globals.css';
import AppClientShell from '@/components/AppClientShell';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-8ZB18NNRPR"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-8ZB18NNRPR');
`}}
        />
        {/* iOS native app configuration */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="white-translucent" />
        <meta name="apple-mobile-web-app-title" content="Held" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />

        {/* iOS app icons */}
        <link rel="apple-touch-icon" sizes="144x144" href="/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />

        <meta name="theme-color" content="#ffffff" />

        {/* Web app manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Force iOS native styling directly in head */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* Capacitor iOS specific overrides */
            @media screen and (-webkit-min-device-pixel-ratio: 2) {
              /* Force body padding for Dynamic Island devices */
              @media screen and (device-width: 393px) and (device-height: 852px),
                     screen and (device-width: 430px) and (device-height: 932px),
                     screen and (device-width: 428px) and (device-height: 926px) {
                body {
                  padding-top: 60px !important;
                }
              }

              /* Dynamic Island sticky navigation with extended blur */
              @media screen and (device-width: 393px) and (device-height: 852px),
                     screen and (device-width: 430px) and (device-height: 932px),
                     screen and (device-width: 428px) and (device-height: 926px) {
                nav[class*="sticky"] {
                  top: 0px !important;
                  padding-top: 60px !important;
                  margin-top: -60px !important;
                }
              }
            }
          `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AppClientShell>{children}</AppClientShell>
      </body>
    </html>
  );
}
