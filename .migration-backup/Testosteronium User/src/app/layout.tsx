import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";

export const metadata: Metadata = {
  title: "Testosteronium · My Device",
  description: "Self-service IT support console for this device.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
