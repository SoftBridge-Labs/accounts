'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const isCheckingSession = loading && !user;

  return (
    <div className="page-wrapper">
      <div className="bg-mesh" />
      <Navbar />
      
      <section className="container" style={{ padding: 'clamp(100px, 15vh, 180px) 1.5rem 100px', textAlign: 'center' }}>
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          


          <h1 style={{ fontSize: 'clamp(3.2rem, 9vw, 6rem)', fontWeight: 800, marginBottom: '2rem', lineHeight: '1.05', color: '#0f172a', letterSpacing: '-0.04em' }}>
            Your Global <br className="hidden-mobile" /> 
            <span className="accent-gradient">SoftBridge Account</span>
          </h1>
          
          <p style={{ color: '#64748b', fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', fontWeight: 500, marginBottom: '4rem', maxWidth: '800px', lineHeight: '1.6' }}>
            A single identity provider for all SoftBridge ecosystem services. Securely manage your profiles, audit security nodes, and synchronize preferences across the globe.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '500px', minHeight: '140px' }}>
            {user ? (
                <>
                  <Link href="/dashboard" className="premium-btn animate-spring" style={{ padding: '1.25rem 3.5rem', width: '100%' }}>
                     Go to Identity Hub
                  </Link>
                  <div className="mobile-cta-section" style={{ marginTop: '3rem', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                     <Link href="/security" style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1.5rem 1rem', borderRadius: '24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }} className="animate-spring">
                        <span style={{ fontSize: '1.75rem' }}>🛡️</span>
                        <span style={{ fontWeight: 800, fontSize: '0.7rem', color: '#0f172a' }}>SECURITY</span>
                     </Link>
                     <Link href="/profile" style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1.5rem 1rem', borderRadius: '24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }} className="animate-spring">
                        <span style={{ fontSize: '1.75rem' }}>👤</span>
                        <span style={{ fontWeight: 800, fontSize: '0.7rem', color: '#0f172a' }}>PROFILE</span>
                     </Link>
                  </div>
                </>
            ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {isCheckingSession && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        <span className="loading-wave" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                        Checking saved session
                      </div>
                    )}
                    <Link href="/signup" className="premium-btn animate-spring" style={{ padding: '1.5rem 4rem', fontSize: '1.1rem', width: '100%', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.2)' }}>
                         Create Account
                    </Link>
                    <Link href="/login" className="outline-btn animate-spring" style={{ padding: '1.5rem 4rem', fontSize: '1.1rem', fontWeight: 700, width: '100%', background: '#fff', animationDelay: '0.1s' }}>
                        Sign In
                    </Link>
                </div>
            )}
          </div>
        </div>
      </section>

      <footer style={{ padding: '80px 0', textAlign: 'center', borderTop: '1px solid #f8fafc' }}>
          <p style={{ color: '#cbd5e1', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.75rem' }}>SOFTBRIDGE LABS IDENTITY HUB © 2026</p>
      </footer>
    </div>
  );
}
