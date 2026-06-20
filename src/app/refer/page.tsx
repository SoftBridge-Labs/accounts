import React from 'react';
import { Metadata } from 'next';
import ReferPageClient from './client-page';

export const metadata: Metadata = {
  title: 'SoftBridge Referral Program | Invite Friends & Earn Cash Rewards',
  description: 'Join the SoftBridge Labs referral program. Share your code to give your friends an exclusive 5% discount, and earn 10% commission on every premium plan they unlock.',
  keywords: ['SoftBridge Labs', 'Referral Program', 'Earn Money', 'Affiliate', 'Identity Node', 'Discount Codes', 'SoftBridge Account'],
  openGraph: {
    title: 'SoftBridge Labs Referral Program - Earn 10% Commission',
    description: 'Invite your friends to SoftBridge. They get a 5% discount on premium tier upgrades, and you earn a 10% commission payout on all purchases.',
    url: 'https://account.softbridgelabs.in/refer',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoftBridge Labs Referral Program',
    description: 'Share SoftBridge and earn 10% commission payouts on subscription referrals.',
  },
};

export default function ReferPage() {
  return <ReferPageClient />;
}
