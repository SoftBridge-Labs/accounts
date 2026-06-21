'use client';

import React from 'react';
import Link from 'next/link';

export default function DeletedPage() {
  return (
    <div className="flex-center animate-fade-in auth-shell" style={{ minHeight: '100vh', background: '#f8fafd', padding: '1rem' }}>
      <div className="bg-mesh" />
      <div className="auth-orb one" />
      <div className="auth-orb two" />
      
      <div className="container" style={{ maxWidth: '480px', position: 'relative', zIndex: 1 }}>
        <div className="auth-card-mobile animate-spring" style={{ padding: '4rem 2.5rem', background: '#fff', textAlign: 'center' }}>
          <header style={{ marginBottom: '2.5rem' }}>
             <h1 className="accent-gradient" style={{ fontSize: 'min(3rem, 12vw)', fontWeight: 800, letterSpacing: '-0.06em' }}>SoftBridge</h1>
             <p style={{ color: '#94a3b8', marginTop: '0.2rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' }}>Identity Purged</p>
          </header>

          <div style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🍃</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.03em' }}>Identity Node Deactivated</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.6', fontWeight: 500 }}>
              Your SoftBridge account and all associated profile nodes have been permanently deleted. Any active integrations have been severed and all local variables have been purged.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link href="/signup" className="premium-btn" style={{ width: '100%', minHeight: '3.5rem', fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Create New Identity
            </Link>
            
            <a href="https://softbridgelabs.in" className="outline-btn" style={{ width: '100%', minHeight: '3.5rem', fontSize: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Ecosystem Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
