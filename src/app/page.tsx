'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="page-wrapper" style={{ overflowX: 'hidden' }}>
      <Navbar />
      
      <section style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(100px)', opacity: 0.15, zIndex: -1  }}></div>
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: '350px', height: '350px', background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(90px)', opacity: 0.1, zIndex: -1 }}></div>

        <div className="animate-in" style={{ maxWidth: '1000px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', background: '#f1f5f9', border: '1px solid #e2e8f0', marginBottom: '2.5rem', fontWeight: 600, fontSize: '0.8rem', color: '#64748b' }}>
             NEW IDENTITY LAYER ACTIVE
          </div>
          
          <h1 style={{ fontSize: 'clamp(3.5rem, 9vw, 6.5rem)', lineHeight: '0.98', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
            One Identity. <br /> 
            <span style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Limitless Access.</span>
          </h1>
          
          <p style={{ color: '#475569', fontSize: 'clamp(1rem, 2.2vw, 1.4rem)', fontWeight: 500, marginBottom: '4rem', maxWidth: '750px', margin: '0 auto 4rem', lineHeight: '1.5' }}>
            Manage your global SoftBridge profile, security nodes, and premium status from a single, high-fidelity hub. Designed for the futuristic developer ecosystem.
          </p>
          
          <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {loading ? (
                <div style={{ width: '120px', height: '56px', background: '#f8fafc', borderRadius: '16px', animation: 'pulse-slow 2s infinite' }}></div>
            ) : user ? (
                <Link href="/dashboard" className="premium-btn" style={{ padding: '1.3rem 3rem', borderRadius: '16px', fontSize: '1.1rem', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.2)' }}>
                   GO TO IDENTITY HUB
                </Link>
            ) : (
                <>
                    <Link href="/signup" className="premium-btn" style={{ padding: '1.3rem 3rem', borderRadius: '16px', fontSize: '1.1rem', boxShadow: '0 20px 40px rgba(79, 70, 229, 0.2)' }}>
                        Initialize Account
                    </Link>
                    <Link href="/login" style={{ background: '#fff', color: '#0f172a', padding: '1.3rem 3rem', borderRadius: '16px', border: '1px solid #e2e8f0', fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} className="outline-btn-custom">
                        Existing Access
                    </Link>
                </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '6rem 0', width: '100%', maxWidth: '800px' }} className="animate-in stagger-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '3rem' }}>
                <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>ECOSYSTEM</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>12+ Integrated Apps</p>
                </div>
                <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>SECURITY</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>End-to-End Encryption</p>
                </div>
                <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>UPTIME</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>99.9% Global Sync</p>
                </div>
            </div>
        </div>
      </section>

      <style jsx>{`
        .page-wrapper { background: #fafafa !important; color: #0f172a !important; }
        .outline-btn-custom:hover { background: #fdfdfd !important; border-color: #0f172a !important; transform: translateY(-4px); boxShadow: 0 15px 30px rgba(0,0,0,0.05); }
      `}</style>
    </div>
  );
}
