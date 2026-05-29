import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dairy Flat Air",
  description: "Online booking system for Dairy Flat Air",
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
