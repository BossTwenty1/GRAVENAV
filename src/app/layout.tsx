import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "GRAVENAV",
  description: "Cemetery gravesite location assistance and future GPS-assisted navigation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
