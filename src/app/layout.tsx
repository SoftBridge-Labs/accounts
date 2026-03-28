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
