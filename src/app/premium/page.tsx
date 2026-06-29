'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter, useSearchParams } from 'next/navigation';
import SuperLoader from '@/components/SuperLoader';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function PremiumPageContent() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [appliedRef, setAppliedRef] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryUid = searchParams.get('uid');

  const [externalProfile, setExternalProfile] = useState<any>(null);
  const [externalLoading, setExternalLoading] = useState(false);

  useEffect(() => {
    if (queryUid) {
      setExternalLoading(true);
      softbridgeApi.getAccount(queryUid)
        .then((data) => {
          if (data && data.user) {
            setExternalProfile({ ...data.user, premium_global: data.premium });
          } else {
            setExternalProfile(data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch account for uid", queryUid, err);
          setExternalProfile({ uid: queryUid });
        })
        .finally(() => {
          setExternalLoading(false);
        });
    }
  }, [queryUid]);

  useEffect(() => {
    if (!loading && !user && !queryUid) {
      router.push('/login');
    }
    // Fetch geo-metadata for currency
    const fetchMeta = async () => {
      const { getBrowserMetadata } = await import('@/lib/utils');
      const data = await getBrowserMetadata();
      setMetadata(data);
    };
    fetchMeta();
    // Read stored referral code
    const ref = localStorage.getItem('sb_ref');
    if (ref) setAppliedRef(ref.toUpperCase());
  }, [loading, user, queryUid, router]);

  const activeUid = queryUid || user?.uid;
  const activeProfile = queryUid ? externalProfile : profile;
  const activeEmail = queryUid ? externalProfile?.email : user?.email;
  const activeName = queryUid ? externalProfile?.name : profile?.name;

  const refreshActiveProfile = async () => {
    if (queryUid) {
      try {
        const data = await softbridgeApi.getAccount(queryUid);
        if (data && data.user) {
          setExternalProfile({ ...data.user, premium_global: data.premium });
        } else {
          setExternalProfile(data);
        }
      } catch (err) {
        console.error("Failed to refresh account for uid", queryUid, err);
      }
    } else {
      await refreshProfile();
    }
  };

  const formatPrice = (amount: number) => {
    if (!metadata?.currency) return `₹${amount}`;
    try {
      return new Intl.NumberFormat(undefined, { 
        style: 'currency', 
        currency: metadata.currency,
        maximumFractionDigits: 0 
      }).format(amount);
    } catch (e) {
      return `₹${amount}`;
    }
  };

  if (loading || (queryUid && externalLoading)) return (
    <div className="flex-center" style={{ height: '100vh' }}>
       <div className="bg-mesh" />
       <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
       <p style={{ color: 'var(--text-dim)', marginTop: '1.5rem', fontWeight: 600 }}>SYNCING TIER ACCESS...</p>
    </div>
  );
  
  if (!activeUid) return null;

  const handleRazorpayPayment = async (originalAmount: number, days: number, planName: string) => {
    setProcessing(true);
    const amount = appliedRef ? Math.round(originalAmount * 0.95) : originalAmount;
    
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_rQX9y03Tphqq19',
      amount: amount * 100, 
      currency: metadata?.currency || "INR",
      name: "SOFTBRIDGE LABS",
      description: `${planName.toUpperCase()} - ${days} DAYS ACCESS`,
      image: "https://softbridge.in/favicon.ico",
      handler: async function (response: any) {
        if (response.razorpay_payment_id) {
          try {
            await softbridgeApi.activatePremium(activeUid, days);
            
            if (activeEmail) {
              await softbridgeApi.sendAlert({
                email: activeEmail,
                type: 'premium_activated',
                details: `${planName} node successfully provisioned for ${days} days. Payment ID: ${response.razorpay_payment_id}`
              }).catch(() => null);
            }

            await softbridgeApi.createAuditLog({
                uid: activeUid,
                event: 'premium_purchase_success',
                source: 'softbridge',
                details: { planName, amount, days, paymentId: response.razorpay_payment_id },
                ip: metadata?.ip
            }).catch(() => null);

            // Track referral commission — increment referrer's count
            if (appliedRef) {
              await softbridgeApi.referral.recordNew(appliedRef).catch(() => null);
              localStorage.removeItem('sb_ref'); // consume once
            }

            await refreshActiveProfile();
            setSuccess(`${planName} synchronized successfully.`);
            setTimeout(() => router.push('/dashboard'), 3000);
          } catch (err: any) {
            alert("Provisioning failed: " + err.message);
          }
        }
      },
      prefill: {
        name: activeName || "",
        email: activeEmail || "",
      },
      theme: {
        color: "#4f46e5",
      },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.on('payment.failed', function (response: any) {
      alert("Payment failed: " + response.error.description);
      setProcessing(false);
    });
    rzp1.open();
  };

  const activateFreeTrial = async () => {
    setProcessing(true);
    try {
      await softbridgeApi.addActivity({ uid: activeUid, action: 'free_tier_activation', ip: metadata?.ip }).catch(() => null);
      setSuccess('Free plan is now active.');
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err) {
      alert("Core Experience activation failed.");
    } finally {
      setProcessing(false);
    }
  };

  const premiumPlans = [
    { name: 'Master Identity', days: 30, price: 399, badge: 'ELITE EXPERIENCE', popular: false, saving: 0 },
    { name: 'Pro Plan', days: 90, price: 999, badge: 'PRO EXPERIENCE', popular: true, saving: 198 },
    { name: 'Quantum Sync', days: 180, price: 1899, badge: 'ADVANCED EXPERIENCE', popular: false, saving: 495 },
    { name: 'Omni Presence', days: 365, price: 3499, badge: 'ULTIMATE EXPERIENCE', popular: false, saving: 1355 },
  ];

  const expDate = activeProfile?.premiumUntil ? new Date(activeProfile.premiumUntil) : null;
  const daysLeft = expDate ? Math.ceil((expDate.getTime() - Date.now()) / (1000 * 3600 * 24)) : 0;
  
  // Logic to identify which plan is active based on days left
  const activePlanIndex = activeProfile?.premium ? (() => {
    if (daysLeft > 180) return 3; // Omni
    if (daysLeft > 90) return 2;  // Quantum
    if (daysLeft > 30) return 1;  // Node+
    if (daysLeft > 0) return 0;   // Master
    return -1;
  })() : -1;

  return (
    <div className="page-wrapper">
      <div className="bg-mesh" />
      <Navbar />
      
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <header className="animate-in" style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h1 style={{ fontSize: 'clamp(2.4rem, 8vw, 4.5rem)', fontWeight: 800, color: '#0f172a' }}>Elevate Your <span style={{ color: 'var(--primary)' }}>Access Tier.</span></h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 'clamp(1rem, 1.2vw, 1.2rem)', marginTop: '0.8rem' }}>Unlock premium features across the entire SoftBridge ecosystem.</p>
        </header>

        {/* Referral code applied badge */}
        {appliedRef && !success && (
          <div className="animate-in" style={{
            marginBottom: '2.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(16,185,129,0.08)',
            border: '1.5px solid rgba(16,185,129,0.25)',
            borderRadius: '999px',
            padding: '0.5rem 1.2rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--success)',
          }}>
            🎫 Referral code applied: <strong>{appliedRef}</strong>
          </div>
        )}

        {success && (
          <div className="glass-card animate-in" style={{ marginBottom: '4rem', borderColor: 'var(--success)', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)' }}>
            <h3 style={{ color: 'var(--success)', fontSize: '1.5rem' }}>🎉 {success}</h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-dim)' }}>Activating your plan... Redirecting to your dashboard.</p>
          </div>
        )}

        <div className="grid-auto animate-in stagger-1" style={{ gap: '2rem' }}>
          
          {/* Free Plan */}
          <div className="glass-card plan-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            background: '#fff',
            border: !activeProfile?.premium ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
            boxShadow: !activeProfile?.premium ? '0 20px 40px rgba(79, 70, 229, 0.08)' : 'none',
            position: 'relative',
            padding: '2.5rem',
            borderRadius: '24px'
          }}>
            {!activeProfile?.premium && (
              <div style={{ position: 'absolute', top: '-14px', right: '24px', background: 'var(--primary)', color: '#fff', padding: '4px 14px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>CURRENT PLAN</div>
            )}
            <header style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>CORE EXPERIENCE</p>
              <h3 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 700 }}>Free Tier</h3>
            </header>
            
            <div style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '2.5rem', color: '#0f172a' }}>{formatPrice(0)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/forever</span></div>

            <ul style={{ listStyle: 'none', marginBottom: '4rem', gap: '1.2rem', display: 'flex', flexDirection: 'column', padding: 0 }}>
                <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--success)' }}>check_circle</span> Basic Profile
                </li>
                <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--success)' }}>check_circle</span> Standard App Features
                </li>
                <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--warning)' }}>warning</span> Supported by Ecosystem Ads
                </li>
            </ul>

            <button 
              className={!activeProfile?.premium ? "secondary-btn" : "outline-btn"} 
              style={{ 
                width: '100%', 
                marginTop: 'auto', 
                minHeight: '3.5rem',
                backgroundColor: !activeProfile?.premium ? 'var(--text-main)' : 'transparent',
                color: !activeProfile?.premium ? '#ffffff' : 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: activeProfile?.premium ? 'pointer' : 'default'
              }}
              onClick={activateFreeTrial}
              disabled={processing || !activeProfile?.premium}
            >
              {activeProfile?.premium ? 'Downgrade to Free' : 'Currently Active'}
            </button>
          </div>

          {/* Premium Plans */}
          {premiumPlans.map((plan, i) => {
            const isActive = activePlanIndex === i;
            return (
              <div key={plan.days} className={`glass-card plan-card`} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                background: '#fff', 
                border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                boxShadow: plan.popular || isActive ? '0 20px 40px rgba(79, 70, 229, 0.08)' : 'none',
                position: 'relative',
                padding: '2.5rem',
                borderRadius: '24px'
              }}>
                {plan.popular && !isActive && (
                  <div style={{ position: 'absolute', top: '-14px', right: '24px', background: 'var(--primary)', color: '#fff', padding: '4px 14px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>MOST POPULAR</div>
                )}
                {isActive && (
                  <div style={{ position: 'absolute', top: '-14px', right: '24px', background: 'var(--primary)', color: '#fff', padding: '4px 14px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>ACTIVE PLAN</div>
                )}
                
                <header style={{ marginBottom: '2.5rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: plan.popular || isActive ? 'var(--primary)' : 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>{plan.badge}</p>
                  <h3 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 700 }}>{plan.name}</h3>
                </header>
                
                <div style={{ marginBottom: '2.5rem' }}>
                    {appliedRef ? (
                      <div>
                        <div style={{ fontSize: '1.4rem', textDecoration: 'line-through', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {formatPrice(plan.price)}
                        </div>
                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--success)' }}>
                          {formatPrice(Math.round(plan.price * 0.95))}
                          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{plan.days} days</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.2rem' }}>
                          5% Referral Discount Applied
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#0f172a' }}>
                        {formatPrice(plan.price)}
                        <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{plan.days} days</span>
                      </div>
                    )}
                    {plan.saving > 0 && (
                        <div style={{ marginTop: '0.5rem', color: 'var(--success)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em' }}>SAVE {formatPrice(plan.saving)}</div>
                    )}
                </div>

                <ul style={{ listStyle: 'none', marginBottom: '4rem', gap: '1.2rem', display: 'flex', flexDirection: 'column', padding: 0 }}>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>check_circle</span> Full Ecosystem Access
                    </li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>check_circle</span> Custom Identity Unlocked
                    </li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>check_circle</span> Ad-Free Experience
                    </li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>check_circle</span> Premium SoftBridge Workspace
                    </li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>check_circle</span> Priority Support Sync
                    </li>
                </ul>

                <button 
                  className={isActive ? "secondary-btn" : "premium-btn"} 
                  style={{ 
                    width: '100%', 
                    marginTop: 'auto', 
                    minHeight: '3.5rem',
                    backgroundColor: isActive ? '#f1f5f9' : 'var(--primary)',
                    color: isActive ? 'var(--text-dim)' : '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: isActive ? 'default' : 'pointer'
                  }}
                  onClick={() => handleRazorpayPayment(plan.price, plan.days, plan.name)}
                  disabled={processing || isActive}
                >
                  {processing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'center' }}>
                      <div style={{ width: '18px', height: '18px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-fast 0.6s linear infinite' }} />
                    </div>
                  ) : (isActive ? 'Currently Active' : `Unlock ${plan.days} Days`)}
                </button>
              </div>
            );
          })}

        </div>

        {/* Detailed Feature Comparison Section */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '2.5rem',
          border: '1px solid var(--border-subtle)',
          marginTop: '4rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)'
        }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>
            Ecosystem Features Comparison
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', width: '40%' }}>Ecosystem Feature</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', width: '30%' }}>Free Tier</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem', width: '30%' }}>Premium Experience (Paid)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Ad Experience', free: 'Supported by ads', paid: '100% Ad-Free Experience' },
                  { name: 'Identity Personalization', free: 'Standard profile', paid: 'Custom avatars, unique nicknames & premium styles' },
                  { name: 'Multi-device Sync Priority', free: 'Standard sync priority', paid: 'L1 instant priority synchronization' },
                  { name: 'SoftBridge Workspace', free: 'Basic access', paid: 'Premium workspace access' },
                  { name: 'Beta Features & Access', free: '✕', paid: 'First access to new SoftBridge apps & tools' },
                  { name: 'Ecosystem API Access', free: 'Standard daily limit', paid: 'Higher limit allocation for automations' },
                  { name: 'Premium Support Channel', free: 'Ecosystem forum support', paid: 'Priority email & ticket escalation' }
                ].map((feat, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                      {feat.name}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: feat.free === '✕' ? 'var(--text-muted)' : 'var(--text-dim)' }}>
                      {feat.free}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {feat.paid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4rem', maxWidth: '700px', marginInline: 'auto', lineHeight: 1.6 }} className="animate-in stagger-2">
            * To view what's included check individual product pricing, this plan gives access to entire paid ecosystem of SoftBridge Labs. {activeProfile?.premiumUntil && `Your subscription expires on: ${new Date(activeProfile.premiumUntil).toLocaleDateString()}`}
        </p>

        <section style={{ marginTop: '8rem', textAlign: 'center' }} className="animate-in stagger-3">
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '3rem' }}>SECURE PAYMENT GATEWAY POWERED BY RAZORPAY</p>
            <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', opacity: 0.25, filter: 'grayscale(1)', flexWrap: 'wrap' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" style={{ height: '32px' }} />
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" style={{ height: '32px' }} />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" style={{ height: '32px' }} />
            </div>
        </section>
      </main>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={
      <div className="flex-center" style={{ height: '100vh' }}>
        <div className="bg-mesh" />
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
        <p style={{ color: 'var(--text-dim)', marginTop: '1.5rem', fontWeight: 600 }}>SYNCING TIER ACCESS...</p>
      </div>
    }>
      <PremiumPageContent />
    </Suspense>
  );
}
