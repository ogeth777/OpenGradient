import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TERMINAL AI",
  description: "Base Trading Terminal: Trading, Risks, Yields, Portfolio, Trending Tokens, Top Gainers.",
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
