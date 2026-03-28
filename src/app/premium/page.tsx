'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

export default function PremiumPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [activating, setActivating] = useState(false);
  const [success, setSuccess] = useState('');
  const router = useRouter();

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="pulse-slow" style={{ color: 'var(--text-dim)' }}>Loading Tier Access...</div></div>;
  
  if (!user) {
    router.push('/login');
    return null;
  }

  const activatePremium = async (days: number) => {
    setActivating(true);
    setSuccess('');
    try {
      await softbridgeApi.activatePremium(user.uid, days);
      await softbridgeApi.sendAlert({
          email: user.email!,
          type: 'premium_activated',
          details: `Global Premium identity activated for ${days} days duration.`
      });
      await refreshProfile();
      setSuccess(`Identity upgraded to Premium for ${days} days!`);
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to process premium activation.");
    } finally {
      setActivating(false);
    }
  };

  const plans = [
    { name: 'Core Experience', days: 7, price: 'Free', description: 'Experience Premium for a trial duration.' },
    { name: 'Professional Identity', days: 30, price: '₹999', description: 'Our most utilized plan for developers.' },
    { name: 'Bridge Enterprise', days: 365, price: '₹9,999', description: 'Full elite identity for yearly access.' }
  ];

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="container" style={{ paddingTop: '160px', paddingBottom: '80px' }}>
        <header className="animate-in" style={{ textAlign: 'center', marginBottom: '6rem' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800 }}>Elevate Your <span className="text-gradient">Bridge Access.</span></h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', marginTop: '1rem' }}>Global elite privileges for the SoftBridge Labs Ecosystem.</p>
        </header>

        {success && (
          <div className="glass-card animate-in" style={{ marginBottom: '4rem', borderColor: 'var(--success)', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)' }}>
            <h3 style={{ color: 'var(--success)' }}>🎉 {success}</h3>
            <p style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>Syncing worldwide identity nodes... Redirecting to hub.</p>
          </div>
        )}

        <div className="grid-auto animate-in stagger-1">
          {plans.map((plan, i) => (
            <div key={plan.name} className="glass-card stagger-1" style={{ display: 'flex', flexDirection: 'column', transition: 'var(--transition-smooth)' }}>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>{plan.name}</h3>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', lineHeight: '1.6' }}>{plan.description}</p>
                <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2.5rem' }}>{plan.price}</div>
                
                <ul style={{ listStyle: 'none', marginBottom: '3rem', gap: '1.2rem', display: 'flex', flexDirection: 'column' }}>
                    <li style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', gap: '10px' }}>✅ {plan.days} Days Elite Access</li>
                    <li style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', gap: '10px' }}>✅ Worldwide Priority Queue</li>
                    <li style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', gap: '10px' }}>✅ Custom Identity Parameters</li>
                    <li style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', gap: '10px' }}>✅ Real-time Lab Analytics</li>
                </ul>

                <button 
                  className={`premium-btn ${activating ? 'disabled' : ''}`} 
                  style={{ width: '100%', marginTop: 'auto', padding: '1.2rem' }}
                  onClick={() => activatePremium(plan.days)}
                  disabled={activating}
                >
                  {activating ? 'PROCESSING TIER...' : 'ACTIVATE ACCESS'}
                </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
