import type { Metadata } from "next";
import { Fraunces, DM_Sans, JetBrains_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retro-ball.pretlabs.app";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const SITE_NAME = "Retro Ball";
const DESCRIPTION =
  "Live realtime Mad/Sad/Glad retrospective board for agile teams. Share a 6-digit room code, write cards, vote, and discuss — no accounts, no setup, ephemeral 24-hour rooms.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: "%s · Retro Ball" },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Retro Ball" }],
  keywords: [
    "retrospective",
    "agile retrospective",
    "scrum retro",
    "mad sad glad",
    "team retro",
    "realtime collaboration",
    "online retro tool",
    "free retro tool",
    "anonymous retro",
  ],
  category: "productivity",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <div aria-hidden className="riso-blobs">
          <span className="riso-blob riso-blob--1" />
          <span className="riso-blob riso-blob--2" />
          <span className="riso-blob riso-blob--3" />
          <span className="riso-blob riso-blob--4" />
          <span className="riso-blob riso-blob--5" />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: SITE_NAME,
              url: SITE_URL,
              description: DESCRIPTION,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              featureList: [
                "Live realtime card sync",
                "Mad/Sad/Glad retrospective format",
                "Dot voting with configurable per-user limit",
                "Anonymous mode with facilitator-controlled reveal",
                "Countdown timer",
                "Ephemeral 24-hour rooms",
                "No account required, join with 6-digit code",
              ],
            }),
          }}
        />
        {children}
      </body>
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  );
}
