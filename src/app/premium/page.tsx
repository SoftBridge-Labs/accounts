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
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh' }}>
       <div className="bg-mesh" />
       <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
       <p style={{ color: 'var(--text-dim)', marginTop: '1.5rem', fontWeight: 600 }}>SYNCING TIER ACCESS...</p>
    </div>
  );
  
  if (!user) return null;

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_rQX9y03Tphqq19',
      amount: 39900, 
      currency: "INR",
      name: "SOFTBRIDGE LABS",
      description: "MASTER IDENTITY - 30 DAYS ACCESS",
      image: "https://softbridge.in/favicon.ico",
      handler: async function (response: any) {
        if (response.razorpay_payment_id) {
          try {
            await softbridgeApi.activatePremium(user.uid, 30);
            
            await softbridgeApi.sendAlert({
              email: user.email!,
              type: 'premium_activated',
              details: `Master Identity node successfully provisioned for 30 days. Payment ID: ${response.razorpay_payment_id}`
            }).catch(() => null);

            await refreshProfile();
            setSuccess('Master Identity synchronized successfully.');
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
      setSuccess('Core Experience activated with basic node parameters.');
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err) {
      alert("Core Experience activation failed.");
    } finally {
      setProcessing(false);
    }
  };

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

        <div className="grid-auto animate-in stagger-1">
          
          {/* Free Plan */}
          <div className="glass-card plan-card stagger-1" style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
            <header style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>CORE EXPERIENCE</p>
              <h3 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.2rem)', color: '#0f172a' }}>Free Tier</h3>
            </header>
            
            <div style={{ fontSize: 'clamp(3rem, 7vw, 3.5rem)', fontWeight: 900, marginBottom: '2.5rem', color: '#0f172a' }}>₹0<span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/forever</span></div>

            <ul style={{ listStyle: 'none', marginBottom: '4rem', gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <li style={{ fontSize: '1rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '14px' }}>✅ Basic Node Identification</li>
                <li style={{ fontSize: '1rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '14px' }}>✅ Standard App Features</li>
                <li style={{ fontSize: '1rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '14px' }}>⚠️ Supported by Ecosystem Ads</li>
            </ul>

            <button 
              className="outline-btn" 
              style={{ width: '100%', marginTop: 'auto', minHeight: '3.8rem' }}
              onClick={activateFreeTrial}
              disabled={processing}
            >
              Continue with Ads
            </button>
          </div>

          {/* Premium Plan */}
          <div className="glass-card plan-card premium stagger-2" style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '2px solid var(--primary)' }}>
            <header style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>ELITE EXPERIENCE</p>
              <h3 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.2rem)', color: '#0f172a' }}>Master Identity</h3>
            </header>
            
            <div style={{ fontSize: 'clamp(3rem, 7vw, 3.5rem)', fontWeight: 900, marginBottom: '2.5rem', color: '#0f172a' }}>₹399<span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/30 days</span></div>

            <ul style={{ listStyle: 'none', marginBottom: '4rem', gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <li style={{ fontSize: '1rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '14px' }}>💎 Full Ecosystem Paid Access</li>
                <li style={{ fontSize: '1rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '14px' }}>💎 Identity Customization Unlocked</li>
                <li style={{ fontSize: '1rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '14px' }}>💎 Ad-Free Experience Everywhere</li>
                <li style={{ fontSize: '1rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '14px' }}>💎 Priority Identity Sync (L1)</li>
            </ul>

            <button 
              className="premium-btn" 
              style={{ width: '100%', marginTop: 'auto', minHeight: '3.8rem' }}
              onClick={handleRazorpayPayment}
              disabled={processing}
            >
              {processing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'center' }}>
                  <div style={{ width: '18px', height: '18px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-fast 0.6s linear infinite' }} />
                  Initializing...
                </div>
              ) : 'Get Master Access'}
            </button>
          </div>

        </div>

        <section style={{ marginTop: '10rem', textAlign: 'center' }} className="animate-in stagger-3">
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
