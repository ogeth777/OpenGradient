import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TERMINAL AI",
  description: "Crypto terminal on Base: Risk analysis, Yields, Portfolio.",
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
