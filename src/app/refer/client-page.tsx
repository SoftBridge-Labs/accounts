'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

const COMMISSION_RATE = 0.10; // 10%

const plans = [
  { name: 'Master Identity', days: 30, price: 399 },
  { name: 'Pro Plan', days: 90, price: 999 },
  { name: 'Quantum Sync', days: 180, price: 1899 },
  { name: 'Omni Presence', days: 365, price: 3499 },
];

const steps = [
  {
    icon: '🔗',
    title: 'Share Your Link',
    desc: 'Copy your unique referral link and share it with friends, communities, or on social media.',
  },
  {
    icon: '👤',
    title: 'Friend Signs Up',
    desc: 'Your friend creates a SoftBridge account and unlocks a premium tier using your link.',
  },
  {
    icon: '💰',
    title: 'You Earn Commission',
    desc: 'Every successful purchase through your code earns you a 10% commission credit.',
  },
];

function ReferPageContent() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const [storedRef, setStoredRef] = useState<string | null>(null);

  useEffect(() => {
    if (refCode) {
      localStorage.setItem('sb_ref', refCode.toUpperCase());
      setStoredRef(refCode.toUpperCase());
    } else {
      const existing = localStorage.getItem('sb_ref');
      if (existing) {
        setStoredRef(existing);
      }
    }
  }, [refCode]);

  return (
    <div className="page-wrapper">
      <div className="bg-mesh" />
      <Navbar />

      <main className="container" style={{ paddingTop: '120px', paddingBottom: '100px' }}>

        {/* ── Personalized invite banner ── */}
        {storedRef && (
          <div
            className="animate-in"
            style={{
              marginBottom: '4rem',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(79,70,229,0.06) 100%)',
              border: '1.5px solid rgba(16,185,129,0.25)',
              borderRadius: '28px',
              padding: '2rem 2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--success)', marginBottom: '0.4rem' }}>
                🎫 SPECIAL REFERRAL DISCOUNT APPLIED
              </p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>
                Referral code <span className="accent-gradient" style={{ fontWeight: 900 }}>{storedRef}</span> is active!
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                You get an exclusive <strong>5% discount</strong> on all premium subscriptions.
              </p>
            </div>
            <Link href="/premium" className="premium-btn" style={{ padding: '0.8rem 1.8rem', fontSize: '0.9rem', background: 'var(--success)' }}>
              Claim Discount Now
            </Link>
          </div>
        )}

        {/* ── Hero ── */}
        <header className="animate-in" style={{ textAlign: 'center', marginBottom: '6rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--primary)', marginBottom: '1rem' }}>
            SOFTBRIDGE REFERRAL PROGRAM
          </p>
          <h1 style={{ fontSize: 'clamp(2.4rem, 8vw, 5rem)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
            Share SoftBridge.<br />
            <span className="accent-gradient">Earn Together.</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 'clamp(1rem, 1.3vw, 1.25rem)', marginTop: '1.2rem', maxWidth: '560px', marginInline: 'auto', lineHeight: 1.7 }}>
            Invite friends to the SoftBridge ecosystem. They get <strong>5% off</strong>, and you earn <strong>10% commission</strong> on every plan they unlock.
          </p>
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/refer/panel" className="premium-btn">
              Get My Referral Code
            </Link>
            <Link href="/premium" className="outline-btn">
              View Plans & Pricing
            </Link>
          </div>
        </header>

        {/* ── How It Works ── */}
        <section className="animate-in stagger-1" style={{ marginBottom: '7rem' }}>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '3.5rem' }}>
            HOW IT WORKS
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
            {steps.map((step, i) => (
              <div
                key={i}
                className="glass-card"
                style={{ background: '#fff', textAlign: 'center', padding: '3rem 2rem' }}
              >
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '22px',
                  background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(37,99,235,0.08))',
                  border: '1px solid rgba(79,70,229,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  marginInline: 'auto',
                  marginBottom: '1.5rem',
                }}>
                  {step.icon}
                </div>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginInline: 'auto',
                  marginBottom: '1.2rem',
                }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                  {step.title}
                </h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.65 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Commission Earnings Table ── */}
        <section className="animate-in stagger-2" style={{ marginBottom: '7rem' }}>
          <div className="glass-card" style={{ background: '#fff', overflow: 'hidden' }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                COMMISSION BREAKDOWN
              </p>
              <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, color: '#0f172a' }}>
                Referral Program Benefits
              </h2>
              <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Your friends save 5%, and you earn 10% cash commission reward on every subscription!
              </p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                    {['Plan', 'Duration', 'Regular Price', 'Friend Gets (5% Off)', 'Your Reward (10%)'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.2rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, i) => (
                    <tr
                      key={plan.name}
                      style={{
                        borderBottom: i < plans.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(248,250,252,0.8)',
                        transition: 'background 0.2s',
                      }}
                    >
                      <td style={{ padding: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                        {plan.name}
                      </td>
                      <td style={{ padding: '1.2rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                        {plan.days} days
                      </td>
                      <td style={{ padding: '1.2rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                        ₹{plan.price.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '1.2rem', color: 'var(--success)', fontWeight: 700 }}>
                        ₹{Math.round(plan.price * 0.95).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '1.2rem' }}>
                        <span style={{
                          background: 'rgba(79,70,229,0.1)',
                          color: 'var(--primary)',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          padding: '0.35rem 0.9rem',
                          borderRadius: '999px',
                          border: '1px solid rgba(79,70,229,0.2)',
                        }}>
                          ₹{Math.round(plan.price * COMMISSION_RATE).toLocaleString('en-IN')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      <footer style={{ textAlign: 'center', paddingBottom: '3rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        Commission credits and discount rewards are subject to SoftBridge Labs Referral Program Terms and Conditions.
      </footer>
    </div>
  );
}

export default function ReferPageClient() {
  return (
    <Suspense fallback={
      <div className="flex-center" style={{ height: '100vh' }}>
        <div className="bg-mesh" />
        <div style={{ width: '44px', height: '44px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }} />
      </div>
    }>
      <ReferPageContent />
    </Suspense>
  );
}
