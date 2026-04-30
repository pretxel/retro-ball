import type { Metadata } from "next";
import { Fraunces, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  weight: ["400", "500", "700", "800", "900"],
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

export const metadata: Metadata = {
  title: "Retro Ball",
  description: "Run an honest retro with your team. No accounts, no clutter, ephemeral.",
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
        {children}
      </body>
    </html>
  );
}
