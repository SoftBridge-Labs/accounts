'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function ClaimPageContent() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/claim');
    }
    
    const fetchMeta = async () => {
      const { getBrowserMetadata } = await import('@/lib/utils');
      const data = await getBrowserMetadata();
      setMetadata(data);
    };
    fetchMeta();
  }, [loading, user, router]);

  const isProfileLoading = user && !profile;
  if (loading || isProfileLoading || !user) return (
    <div className="flex-center" style={{ height: '100vh' }}>
       <div className="bg-mesh" />
       <div className="spin-fast" style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
       <p style={{ color: 'var(--text-dim)', marginTop: '1.5rem', fontWeight: 600 }}>CHECKING ELIGIBILITY...</p>
    </div>
  );

  const notEligible = profile?.premium || profile?.premium_global || profile?.trial_redeemed;

  const activateTrial = async (autopay: boolean) => {
    setProcessing(true);
    try {
      if (autopay) {
        // Implement Razorpay Autopay setup for 30 days trial then recur
        // Call backend to create subscription
        // For the trial, we assume there's a plan specifically meant for the Pro Plan
        // "plan_123abc" is a placeholder - this should be a real Plan ID from Razorpay
        const planId = process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID || 'plan_123abc';
        // Set the start date 30 days from now (in seconds)
        const startAt = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        const subRes = await softbridgeApi.billing.createSubscription({ planId, totalCount: 12, startAt, uid: user.uid });
        if (!subRes || !subRes.subscription || !subRes.subscription.id) {
           throw new Error(subRes?.message || "Failed to create subscription on backend.");
        }

        // Record checkout intent
        if (user?.email) {
           await softbridgeApi.billing.recordCheckoutIntent({
              uid: user.uid,
              email: user.email,
              planName: "Pro Plan Free Trial",
              amount: 0,
              type: 'claim'
           }).catch(() => null);
        }
        
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_rQX9y03Tphqq19',
          name: "SOFTBRIDGE LABS",
          description: "30 Days Free Trial with Autopay",
          image: "https://softbridge.in/favicon.ico",
          subscription_id: subRes.subscription.id,
          handler: async function (response: any) {
            try {
              // Verify signature
              const verifyRes = await softbridgeApi.billing.verifyPayment({
                 razorpay_order_id: response.razorpay_subscription_id, // For subscriptions, signature validation uses subscription_id
                 razorpay_payment_id: response.razorpay_payment_id,
                 razorpay_signature: response.razorpay_signature
              });
              if (verifyRes.success) {
                 // Payment success, clear intent
                 await softbridgeApi.billing.clearCheckoutIntent(user.uid).catch(() => null);
                 await finalizeTrial();
              } else {
                 alert("Payment verification failed");
                 setProcessing(false);
              }
            } catch (err: any) {
              alert("Verification error: " + err.message);
              setProcessing(false);
            }
          },
          prefill: {
            name: profile?.name || "",
            email: user?.email || "",
          },
          theme: {
            color: "#10b981",
          },
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response: any) {
          alert("Setup failed: " + response.error.description);
          setProcessing(false);
        });
        rzp1.open();
      } else {
        await finalizeTrial();
      }
    } catch (err) {
      alert("Trial activation failed.");
      setProcessing(false);
    }
  };
  
  const finalizeTrial = async () => {
    try {
      await softbridgeApi.activatePremium(user.uid, 30);
      
      await softbridgeApi.addActivity({ 
        uid: user.uid, 
        action: 'claimed_free_trial', 
        ip: metadata?.ip 
      }).catch(() => null);
      
      await refreshProfile();
      setSuccess('Your 30-Day Free Trial is now active!');
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (error: any) {
      alert("Failed to activate trial: " + error.message);
      setProcessing(false);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="bg-mesh" />
      <Navbar />
      
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto' }}>
        <header className="animate-in" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 style={{ fontSize: 'clamp(2.4rem, 8vw, 4rem)', fontWeight: 800, color: '#0f172a' }}>Claim Your <span style={{ color: 'var(--success)' }}>Free Trial.</span></h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 'clamp(1rem, 1.2vw, 1.2rem)', marginTop: '0.8rem' }}>Unlock all premium features for 30 days, completely free.</p>
        </header>

        {success ? (
          <div className="glass-card animate-in" style={{ marginBottom: '4rem', borderColor: 'var(--success)', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)' }}>
            <h3 style={{ color: 'var(--success)', fontSize: '1.5rem' }}>🎉 {success}</h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-dim)' }}>Redirecting to your dashboard...</p>
          </div>
        ) : notEligible ? (
          <div className="glass-card animate-in" style={{ marginBottom: '4rem', borderColor: 'var(--error)', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)' }}>
            <h3 style={{ color: 'var(--error)', fontSize: '1.5rem' }}>Not Eligible for Trial</h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-dim)' }}>
              You are already on a premium plan or have previously redeemed a trial.
            </p>
          </div>
        ) : (
          <div className="grid-auto animate-in stagger-1" style={{ gap: '2rem' }}>
            
            {/* Option 1: With Autopay */}
            <div className="glass-card plan-card" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              background: '#fff',
              border: '2px solid var(--success)',
              boxShadow: '0 20px 40px rgba(16, 185, 129, 0.08)',
              position: 'relative',
              padding: '2.5rem',
              borderRadius: '24px'
            }}>
              <div style={{ position: 'absolute', top: '-14px', right: '24px', background: 'var(--success)', color: '#fff', padding: '4px 14px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>RECOMMENDED</div>
              
              <header style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 700 }}>Auto-Pay & Continue</h3>
              </header>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                Setup billing now. Enjoy your 30-day free trial, and transition seamlessly into the Pro Plan once the trial ends. Cancel anytime.
              </p>

              <button 
                className="premium-btn"
                style={{ 
                  width: '100%', 
                  marginTop: 'auto', 
                  minHeight: '3.5rem',
                  backgroundColor: 'var(--success)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => activateTrial(true)}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Continue with Auto-Pay'}
              </button>
            </div>

            {/* Option 2: Without Autopay */}
            <div className="glass-card plan-card" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              background: '#fff',
              border: '1px solid var(--border-subtle)',
              position: 'relative',
              padding: '2.5rem',
              borderRadius: '24px'
            }}>
              <header style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: 700 }}>Try Without Auto-Pay</h3>
              </header>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                Activate your 30-day free trial instantly. No card details required now. Your access will pause when the trial expires unless you upgrade.
              </p>

              <button 
                className="outline-btn"
                style={{ 
                  width: '100%', 
                  marginTop: 'auto', 
                  minHeight: '3.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => activateTrial(false)}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Continue Without Auto-Pay'}
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="flex-center" style={{ height: '100vh' }}>
        <div className="bg-mesh" />
        <div className="spin-fast" style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
      </div>
    }>
      <ClaimPageContent />
    </Suspense>
  );
}
