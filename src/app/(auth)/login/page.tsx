'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { softbridgeApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SuperLoader from '@/components/SuperLoader';

import { getBrowserMetadata } from '@/lib/utils';

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
      const meta = await getBrowserMetadata();

      await setPersistence(auth, browserLocalPersistence).catch(() => null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const normalizedEmail = email.toLowerCase().trim();

      // 3. Complete login on the backend
      await softbridgeApi.syncLogin({ uid, email: normalizedEmail, ip: meta.ip }).catch(() => null);

      // Log activity: Login event
      try {
        const authDetails = `Authorized login detected. NODE METADATA: IP: ${meta.ip} ACCESS DEVICE: ${meta.device} USER AGENT: ${meta.ua} LOCATION: ${meta.location || 'Distributed Node'}`;

        await softbridgeApi.addActivity({ uid, action: 'login', ip: meta.ip }).catch(() => null);
        await softbridgeApi.createAuditLog({
          uid,
          event: 'login_success',
          source: 'softbridge',
          details: {
            device: meta.device,
            location: meta.location,
            userAgent: meta.ua,
            node_metadata: authDetails
          },
          ip: meta.ip
        }).catch(() => null);
      } catch (e) { }

      // Proactively notify of node access with ENRICHED metadata in the background
      softbridgeApi.sendAlert({
        email: normalizedEmail,
        type: 'identity_access',
        details: `Authorized login detected on your SoftBridge Identity Hub node. \n\nNODE METADATA:\nIP: ${meta.ip}\nACCESS DEVICE: ${meta.device}\nUSER AGENT: ${meta.ua}\nLOCATION: ${meta.location || 'Distributed Node'}`
      }).catch((err) => console.error("Login alert transmission failed:", err));

      // Redirect immediately after Firebase success; backend side-notifications should never block auth UX.
      setShowSuperLoader(true);
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

  return (
    <div className="flex-center animate-fade-in auth-shell" style={{ minHeight: '100vh', background: '#f8fafd', padding: '1.5rem', color: 'var(--text-main)' }}>
      <div className="bg-mesh" />
      <div className="auth-orb one" style={{ opacity: 0.5 }} />
      <div className="auth-orb two" style={{ opacity: 0.5 }} />
      {showSuperLoader && <SuperLoader message="Finalizing secure session" onComplete={() => router.replace('/dashboard')} />}
      
      <div className="container" style={{ maxWidth: '1050px', position: 'relative', zIndex: 1, padding: 0 }}>
        <div className="auth-split-container">
          {/* Left Side: Brand Panel */}
          <div className="auth-split-sidebar">
            <div style={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: '120%',
              height: '120%',
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '340px' }}>
              <div className="brand-header" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '3.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 950, fontSize: '0.95rem' }}>S</div>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#fff' }}>SoftBridge</span>
              </div>
              
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '0.8rem', color: '#fff' }}>Welcome Back</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', marginBottom: '3.5rem', fontWeight: 500 }}>Access your SoftBridge account nodes and secure workspace.</p>
              
              <div className="steps-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', color: '#0f172a', padding: '0.9rem 1.1rem', borderRadius: '16px', fontWeight: 700, fontSize: '0.88rem', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>1</span>
                  Identity Authentication
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '0.9rem 1.1rem', borderRadius: '16px', fontWeight: 700, fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>2</span>
                  Security Log Audit
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '0.9rem 1.1rem', borderRadius: '16px', fontWeight: 700, fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>3</span>
                  Ecosystem Sync
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form Panel */}
          <div className="auth-split-form-panel">
            <div style={{ width: '100%', maxWidth: '370px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Sign In Account</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '2.5rem', fontWeight: 500 }}>Enter your credentials to access your account.</p>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="input-label" style={{ marginBottom: '0.45rem' }}>Identity ID (Email)</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    autoComplete="email"
                    placeholder="eg. johnfrans@gmail.com"
                    className="input-field"
                    style={{ borderRadius: '14px', padding: '1rem 1.1rem' }}
                  />
                </div>
                
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <label className="input-label" style={{ margin: 0 }}>Access Key</label>
                    <Link href="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Forgot password?</Link>
                  </div>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="input-field"
                    style={{ borderRadius: '14px', padding: '1rem 1.1rem' }}
                  />
                </div>

                {error && (
                  <div style={{ padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', color: '#f87171', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}>
                     <span>⚠️</span> {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="premium-btn" style={{ width: '100%', borderRadius: '14px', padding: '1rem', fontSize: '0.92rem', fontWeight: 700 }}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <footer style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                New identities: <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', marginLeft: '0.3rem' }}>Create Account</Link>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
