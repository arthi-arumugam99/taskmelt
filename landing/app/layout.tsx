import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://taskmelt.app'),
  title: "taskmelt - Chaos in. Clarity out.",
  description: "Transform your mental chaos into organized tasks. Brain dump everything, let AI create your perfect schedule.",
  keywords: ["productivity", "task management", "habit tracker", "brain dump", "AI tasks", "mental clarity"],
  authors: [{ name: "taskmelt" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  openGraph: {
    title: "taskmelt - Chaos in. Clarity out.",
    description: "Transform your mental chaos into organized tasks. Brain dump everything, let AI create your perfect schedule.",
    type: "website",
    locale: "en_US",
    url: "https://taskmelt.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "taskmelt - Chaos in. Clarity out.",
    description: "Transform your mental chaos into organized tasks.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
