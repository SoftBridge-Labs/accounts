import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SoftBridge Accounts | Unified Identity System",
  description: "Manage your personal information, security settings, and premium subscriptions in one central location.",
};

import VerificationGuard from '@/components/VerificationGuard';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className={inter.className}>
        <div className="bg-mesh" />
        <AuthProvider>
          <VerificationGuard>
            {children}
          </VerificationGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
