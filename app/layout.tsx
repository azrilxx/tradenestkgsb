import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade Nest - Trade Anomaly Detection Platform",
  description: "Automated detection of pricing & tariff anomalies for import/export businesses",
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