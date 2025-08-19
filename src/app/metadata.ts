import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Held - The quiet home for the things you hold",
  description: "A quiet, brand-driven app for people who care deeply about the physical objects they own.",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Held",
  },
  formatDetection: {
    telephone: false,
  },
};
