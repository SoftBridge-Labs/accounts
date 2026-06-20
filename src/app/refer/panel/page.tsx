'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const COMMISSION_RATE = 0.10; // 10%

const plans = [
  { name: 'Master Identity', days: 30, price: 399 },
  { name: 'Identity Node+', days: 90, price: 999 },
  { name: 'Quantum Sync', days: 180, price: 1899 },
  { name: 'Omni Presence', days: 365, price: 3499 },
];

/** Derives a stable 6-char referral code from a Firebase UID */
function deriveCode(uid: string): string {
  return uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
}

export default function ReferralPanelPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [registering, setRegistering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const referralLink = code
    ? `https://account.softbridgelabs.in/refer?ref=${code}`
    : '';

  const totalEarned = count !== null
    ? plans.reduce((sum, p) => sum + Math.round(p.price * COMMISSION_RATE), 0) // max theoretical
    : 0;

  // Estimated commission: count × average commission per plan
  const avgCommission = Math.round(
    plans.reduce((s, p) => s + p.price * COMMISSION_RATE, 0) / plans.length
  );
  const estimatedEarnings = count ? count * avgCommission : 0;

  const initReferral = useCallback(async (uid: string) => {
    const derived = deriveCode(uid);
    setCode(derived);
    setRegistering(true);
    try {
      // Check if code already exists
      const check = await softbridgeApi.referral.checkCode(derived).catch(() => null);
      if (!check?.valid) {
        // Register new code
        await softbridgeApi.referral.saveCode(derived);
      }
      // Fetch count
      const countData = await softbridgeApi.referral.getCount(derived).catch(() => null);
      setCount(countData?.count ?? 0);
    } catch (err: any) {
      setError('Could not load referral data. Please try again.');
    } finally {
      setRegistering(false);
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      initReferral(user.uid);
    }
  }, [user, initReferral]);

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    if (navigator.share && referralLink) {
      try {
        await navigator.share({
          title: 'Join SoftBridge',
          text: `Join SoftBridge Labs ecosystem using my referral code ${code}!`,
          url: referralLink,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch {
        handleCopy(); // Fallback to copy
      }
    } else {
      handleCopy();
    }
  };

  const handleRefresh = async () => {
    if (!code) return;
    setRegistering(true);
    try {
      const countData = await softbridgeApi.referral.getCount(code);
      setCount(countData?.count ?? 0);
    } catch {
      setError('Failed to refresh count.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading || initializing) return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="bg-mesh" />
      <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.08em' }}>
        {registering ? 'INITIALIZING REFERRAL NODE...' : 'LOADING...'}
      </p>
    </div>
  );

  if (!user) return null;

  return (
    <div className="page-wrapper">
      <div className="bg-mesh" />
      <Navbar />

      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>

        {/* ── Header ── */}
        <header className="animate-in" style={{ marginBottom: '4rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--primary)', marginBottom: '0.5rem' }}>
            REFERRAL PROGRAM
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
            Your Referral <span className="accent-gradient">Panel</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', marginTop: '0.75rem' }}>
            Share your link and earn 10% commission on every successful premium purchase.
          </p>
        </header>

        {error && (
          <div style={{ marginBottom: '2rem', padding: '1rem 1.5rem', borderRadius: '16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>

          {/* ── Your Code Card ── */}
          <div className="glass-card animate-in stagger-1" style={{ background: '#fff', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                YOUR REFERRAL CODE
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(37,99,235,0.04))',
                border: '2px dashed rgba(79,70,229,0.25)',
                borderRadius: '20px',
                padding: '2rem',
              }}>
                <span style={{
                  fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
                  fontWeight: 900,
                  letterSpacing: '0.15em',
                  background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontFamily: 'var(--font-heading)',
                }}>
                  {code || '------'}
                </span>
              </div>
            </div>

            {/* Referral link */}
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                YOUR REFERRAL LINK
              </p>
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '1rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                overflow: 'hidden',
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {referralLink}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                id="referral-copy-btn"
                onClick={handleCopy}
                className="premium-btn"
                style={{ flex: 1, minWidth: '120px', fontSize: '0.9rem', padding: '0.9rem 1.5rem', background: copied ? 'var(--success)' : '#0f172a' }}
              >
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
              <button
                id="referral-share-btn"
                onClick={handleShare}
                className="outline-btn"
                style={{ flex: 1, minWidth: '120px', fontSize: '0.9rem', padding: '0.9rem 1.5rem' }}
              >
                {shareSuccess ? '✓ Shared!' : '↗ Share'}
              </button>
            </div>
          </div>

          {/* ── Stats Card ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Referrals used */}
            <div className="glass-card animate-in stagger-2" style={{ background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    TOTAL REFERRALS
                  </p>
                  <p style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    {count ?? '—'}
                  </p>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
                    Successful activations via your code
                  </p>
                </div>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'rgba(79,70,229,0.08)',
                  border: '1px solid rgba(79,70,229,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  👥
                </div>
              </div>
              <button
                id="referral-refresh-btn"
                onClick={handleRefresh}
                disabled={registering}
                style={{
                  marginTop: '1.2rem',
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                }}
              >
                {registering ? '⟳ Syncing...' : '⟳ Refresh'}
              </button>
            </div>

            {/* Estimated commission */}
            <div className="glass-card animate-in stagger-3" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04))', border: '1.5px solid rgba(16,185,129,0.2)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--success)', marginBottom: '0.5rem' }}>
                ESTIMATED COMMISSION EARNED
              </p>
              <p style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                ₹{estimatedEarnings.toLocaleString('en-IN')}
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                Based on average plan commission of ₹{avgCommission}/referral
              </p>
            </div>
          </div>
        </div>

        {/* ── Commission Table ── */}
        <div className="glass-card animate-in stagger-3" style={{ background: '#fff', marginBottom: '3rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--primary)', marginBottom: '0.4rem' }}>
              COMMISSION STRUCTURE
            </p>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              Earnings Per Plan
            </h2>
            <p style={{ color: 'var(--text-dim)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
              10% of the plan price is credited for each referral purchase.
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                  {['Plan', 'Duration', 'Price', 'Your Commission (10%)'].map(h => (
                    <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, i) => (
                  <tr
                    key={plan.name}
                    style={{ borderBottom: i < plans.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                  >
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>{plan.name}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>{plan.days} days</td>
                    <td style={{ padding: '1rem', color: 'var(--text-dim)', fontWeight: 600 }}>₹{plan.price.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: 'rgba(16,185,129,0.1)',
                        color: 'var(--success)',
                        fontWeight: 800,
                        padding: '0.3rem 0.8rem',
                        borderRadius: '999px',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(16,185,129,0.2)',
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

        {/* ── How It Works reminder ── */}
        <div className="animate-in stagger-4" style={{ textAlign: 'center' }}>
          <Link href="/refer" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', letterSpacing: '0.05em' }}>
            ← View Referral Program Details
          </Link>
        </div>

      </main>
    </div>
  );
}
