import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenGradient The Future of AI on Blockchain",
  description: "Learn about MemSync, BitQuant, and Twin.fun in 5 minutes",
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
