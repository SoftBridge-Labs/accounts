'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import SuperLoader from '@/components/SuperLoader';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PremiumPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // Fetch geo-metadata for currency
    const fetchMeta = async () => {
      const { getBrowserMetadata } = await import('@/lib/utils');
      const data = await getBrowserMetadata();
      setMetadata(data);
    };
    fetchMeta();
  }, [loading, user, router]);

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

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh' }}>
       <div className="bg-mesh" />
       <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
       <p style={{ color: 'var(--text-dim)', marginTop: '1.5rem', fontWeight: 600 }}>SYNCING TIER ACCESS...</p>
    </div>
  );
  
  if (!user) return null;

  const handleRazorpayPayment = async (amount: number, days: number, planName: string) => {
    setProcessing(true);
    
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
            await softbridgeApi.activatePremium(user.uid, days);
            
            await softbridgeApi.sendAlert({
              email: user.email!,
              type: 'premium_activated',
              details: `${planName} node successfully provisioned for ${days} days. Payment ID: ${response.razorpay_payment_id}`
            }).catch(() => null);

            await softbridgeApi.createAuditLog({
                uid: user.uid,
                event: 'premium_purchase_success',
                source: 'softbridge',
                details: { planName, amount, days, paymentId: response.razorpay_payment_id },
                ip: metadata?.ip
            }).catch(() => null);

            await refreshProfile();
            setSuccess(`${planName} synchronized successfully.`);
            setTimeout(() => router.push('/dashboard'), 3000);
          } catch (err: any) {
            alert("Provisioning failed: " + err.message);
          }
        }
      },
      prefill: {
        name: profile?.name || "",
        email: user.email || "",
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
      await softbridgeApi.addActivity({ uid: user.uid, action: 'free_tier_activation', ip: metadata?.ip }).catch(() => null);
      setSuccess('Core Experience activated with basic node parameters.');
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err) {
      alert("Core Experience activation failed.");
    } finally {
      setProcessing(false);
    }
  };

  const premiumPlans = [
    { name: 'Master Identity', days: 30, price: 399, badge: 'ELITE EXPERIENCE', popular: false, saving: 0 },
    { name: 'Identity Node+', days: 90, price: 999, badge: 'PRO EXPERIENCE', popular: true, saving: 198 },
    { name: 'Quantum Sync', days: 180, price: 1899, badge: 'ADVANCED EXPERIENCE', popular: false, saving: 495 },
    { name: 'Omni Presence', days: 365, price: 3499, badge: 'ULTIMATE EXPERIENCE', popular: false, saving: 1355 },
  ];

  const expDate = profile?.premiumUntil ? new Date(profile.premiumUntil) : null;
  const daysLeft = expDate ? Math.ceil((expDate.getTime() - Date.now()) / (1000 * 3600 * 24)) : 0;
  
  // Logic to identify which plan is active based on days left
  const activePlanIndex = profile?.premium ? (() => {
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
            <h1 style={{ fontSize: 'clamp(2.4rem, 8vw, 4.5rem)', fontWeight: 800, color: '#0f172a' }}>Elevate Your <span className="accent-gradient">Access Tier.</span></h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 'clamp(1rem, 1.2vw, 1.2rem)', marginTop: '0.8rem' }}>Global privileges for the SoftBridge Labs identity nodes.</p>
        </header>

        {success && (
          <div className="glass-card animate-in" style={{ marginBottom: '4rem', borderColor: 'var(--success)', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)' }}>
            <h3 style={{ color: 'var(--success)', fontSize: '1.5rem' }}>🎉 {success}</h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-dim)' }}>Syncing worldwide identity nodes... Redirecting to hub.</p>
          </div>
        )}

        <div className="grid-auto animate-in stagger-1" style={{ gap: '2rem' }}>
          
          {/* Free Plan */}
          <div className="glass-card plan-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            background: '#fff',
            border: !profile?.premium ? '2px solid var(--primary)' : '1px solid var(--border)',
            boxShadow: !profile?.premium ? '0 20px 40px rgba(79, 70, 229, 0.1)' : 'none',
            position: 'relative',
            padding: '2.5rem'
          }}>
            {!profile?.premium && (
              <div style={{ position: 'absolute', top: '-14px', right: '24px', background: 'var(--primary)', color: '#fff', padding: '4px 14px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>CURRENT PLAN</div>
            )}
            <header style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>CORE EXPERIENCE</p>
              <h3 style={{ fontSize: '1.8rem', color: '#0f172a' }}>Free Tier</h3>
            </header>
            
            <div style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '2.5rem', color: '#0f172a' }}>{formatPrice(0)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/forever</span></div>

            <ul style={{ listStyle: 'none', marginBottom: '4rem', gap: '1.2rem', display: 'flex', flexDirection: 'column', padding: 0 }}>
                <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>✅ Basic Node Identification</li>
                <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>✅ Standard App Features</li>
                <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>⚠️ Supported by Ecosystem Ads</li>
            </ul>

            <button 
              className={!profile?.premium ? "secondary-btn" : "outline-btn"} 
              style={{ width: '100%', marginTop: 'auto', minHeight: '3.5rem' }}
              onClick={activateFreeTrial}
              disabled={processing || !profile?.premium}
            >
              {profile?.premium ? 'Downgrade to Free' : 'Currently Active'}
            </button>
          </div>

          {/* Premium Plans */}
          {premiumPlans.map((plan, i) => {
            const isActive = activePlanIndex === i;
            return (
              <div key={plan.days} className={`glass-card plan-card ${plan.popular ? 'premium' : ''}`} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                background: '#fff', 
                border: plan.popular || isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                boxShadow: plan.popular || isActive ? '0 20px 40px rgba(79, 70, 229, 0.1)' : 'none',
                position: 'relative',
                padding: '2.5rem'
              }}>
                {plan.popular && !isActive && (
                  <div style={{ position: 'absolute', top: '-14px', right: '24px', background: '#0f172a', color: '#fff', padding: '4px 14px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>MOST POPULAR</div>
                )}
                {isActive && (
                  <div style={{ position: 'absolute', top: '-14px', right: '24px', background: 'var(--primary)', color: '#fff', padding: '4px 14px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>ACTIVE PLAN</div>
                )}
                
                <header style={{ marginBottom: '2.5rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: plan.popular || isActive ? 'var(--primary)' : 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>{plan.badge}</p>
                  <h3 style={{ fontSize: '1.8rem', color: '#0f172a' }}>{plan.name}</h3>
                </header>
                
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#0f172a' }}>{formatPrice(plan.price)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/{plan.days} days</span></div>
                    {plan.saving > 0 && (
                        <div style={{ marginTop: '0.5rem', color: 'var(--success)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em' }}>SAVE {formatPrice(plan.saving)}</div>
                    )}
                </div>

                <ul style={{ listStyle: 'none', marginBottom: '4rem', gap: '1.2rem', display: 'flex', flexDirection: 'column', padding: 0 }}>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>💎 Full Ecosystem Paid Access</li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>💎 Identity Customization Unlocked</li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>💎 Ad-Free Experience Everywhere</li>
                    <li style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '12px' }}>💎 Priority Identity Sync (L1)</li>
                </ul>

                <button 
                  className={isActive ? "secondary-btn" : "premium-btn"} 
                  style={{ width: '100%', marginTop: 'auto', minHeight: '3.5rem' }}
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

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4rem', maxWidth: '700px', marginInline: 'auto', lineHeight: 1.6 }} className="animate-in stagger-2">
            * To view what's included check individual product pricing, this plan gives access to entire paid ecosystem of SoftBridge Labs. {profile?.premiumUntil && `Current session expiry node: ${new Date(profile.premiumUntil).toLocaleDateString()}`}
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
