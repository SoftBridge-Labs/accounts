'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { softbridgeApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SuperLoader from '@/components/SuperLoader';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuperLoader, setShowSuperLoader] = useState(false);
  const router = useRouter();
  const isFormReady = email.trim().length > 0 && password.trim().length > 0;

  const runWithTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T | null> => {
    return Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!isFormReady) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // If persistence fails (some mobile/private contexts), continue with default session persistence.
      await setPersistence(auth, browserLocalPersistence).catch(() => null);
      await signInWithEmailAndPassword(auth, email, password);

      // Redirect immediately after Firebase success; backend side-notifications should never block auth UX.
      setShowSuperLoader(true);
      
      // Proactively notify of node access
      void runWithTimeout(softbridgeApi.sendAlert({
          email,
          type: 'identity_access',
          details: `Authorized login detected on your SoftBridge Identity Hub node.`
        }).catch(() => null), 1800);
    } catch (err: unknown) {
      let customError = 'Authentication failed. Please verify your access keys.';
      const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code || '') : '';
      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
         customError = 'Invalid credentials for this identity node.';
      } else if (code.includes('too-many-requests')) {
         customError = 'Security lockout: Too many failed attempts. Try again later.';
      }
      setError(customError);
    } finally {
      setLoading(false);
    }
  };

  if (showSuperLoader) {
    return <SuperLoader message="Signing you in securely" onComplete={() => router.replace('/dashboard')} />;
  }

  return (
    <div className="flex-center animate-fade-in auth-shell" style={{ minHeight: '100vh', background: '#f8fafd', padding: '1rem' }}>
      <div className="bg-mesh" />
      <div className="auth-orb one" />
      <div className="auth-orb two" />
      <div className="container" style={{ maxWidth: '480px' }}>
        <div className="auth-card-mobile animate-spring" style={{ padding: '3.5rem 2.5rem', background: '#fff' }}>
          <header style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
             <h1 className="accent-gradient" style={{ fontSize: 'min(3rem, 12vw)', fontWeight: 800, letterSpacing: '-0.06em' }}>SoftBridge</h1>
             <p style={{ color: '#94a3b8', marginTop: '0.2rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' }}>ACCOUNT LOGIN</p>
          </header>

          <form onSubmit={handleLogin}>
            <div className="input-wrapper">
              <label className="input-label">Identity ID</label>
              <input 
                type="email" 
                className="input-field" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                autoComplete="email"
                placeholder="identity@softbridge.in"
              />
            </div>
            
            <div className="input-wrapper">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Access Key</label>
                <Link href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textDecoration: 'none' }}>RECOVER</Link>
              </div>
              <input 
                type="password" 
                className="input-field" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid #fee2e2', borderRadius: '16px', color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', gap: '0.6rem', alignItems: 'center', fontWeight: 600 }}>
                 <span style={{ fontSize: '1.2rem' }}>⚠️</span> {error}
              </div>
            )}

            <button type="submit" className="premium-btn" style={{ width: '100%', minHeight: '3.5rem', fontSize: '1rem', marginTop: '1rem' }} disabled={loading}>
              {loading ? (
                <div className="loading-inline" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div className="loading-wave" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  Signing in...
                </div>
              ) : 'Sign In'}
            </button>
            <p className="auth-submit-note">Authentication starts only after you tap Sign In.</p>
          </form>

          <footer style={{ marginTop: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
             New identities: <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', marginLeft: '0.5rem' }}>Create Account</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
