import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GRAVENAV",
    template: "%s | GRAVENAV",
  },
  description: "Cemetery gravesite location assistance and future GPS-assisted navigation.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f2f3ed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>{children}</body>
    </html>
  );
}
