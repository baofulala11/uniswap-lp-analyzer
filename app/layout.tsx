import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uniswap V3 LP Analyzer",
  description: "Analyze Uniswap V3 liquidity pool returns across Ethereum, Base, and BSC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
