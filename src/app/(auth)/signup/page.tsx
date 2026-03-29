'use client';

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence } from 'firebase/auth'; 
import { auth } from '@/lib/firebase';
import { softbridgeApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SuperLoader from '@/components/SuperLoader';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuperLoader, setShowSuperLoader] = useState(false);
  const router = useRouter();
  const isFormReady = name.trim().length > 1 && email.trim().length > 0 && password.trim().length >= 6;

  const runWithTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T | null> => {
    return Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!isFormReady) {
      setError('Please enter name, email, and a password of at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // If persistence fails (some mobile/private contexts), continue with default session persistence.
      await setPersistence(auth, browserLocalPersistence).catch(() => null);
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });

      // Redirect immediately after Firebase account creation; backend sync should not block mobile UX.
      setShowSuperLoader(true);

      void runWithTimeout(softbridgeApi.updateAccountFull({ 
            uid: userCred.user.uid,
            email, 
            name 
        }).catch(() => null), 2200);
        
      void runWithTimeout(softbridgeApi.sendAlert({
          email,
          type: 'identity_provisioned',
          details: `Master Identity node initialized for ${name}.`
        }).catch(() => null), 1800);
    } catch (err: unknown) {
      let customError = 'Identification failed. Please verify your entry parameters.';
      const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code || '') : '';
      if (code.includes('email-already-in-use')) customError = 'Identity ID is already mapped to an existing node.';
      else if (code.includes('weak-password')) customError = 'Access Key is too simple. Use a more complex string.';
      else if (code.includes('invalid-email')) customError = 'Identity ID format is invalid.';
      
      setError(customError);
    } finally {
      setLoading(false);
    }
  };

  if (showSuperLoader) {
    return <SuperLoader message="Creating your identity node" onComplete={() => router.replace('/dashboard?setupHelp=true')} />;
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
             <p style={{ color: '#94a3b8', marginTop: '0.2rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' }}>ACCOUNT INITIALIZATION</p>
          </header>

          <form onSubmit={handleSignup}>
            <div className="input-wrapper">
              <label className="input-label">Your Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                autoComplete="name"
                placeholder="Global Node Name"
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label">Identity ID (Email)</label>
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
              <label className="input-label">New Access Key</label>
              <input 
                type="password" 
                className="input-field" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={6}
                autoComplete="new-password"
                placeholder="Min. 6 characters"
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
                  Creating account...
                </div>
              ) : 'Create Identity'}
            </button>
            <p className="auth-submit-note">No network request is made until you submit the form.</p>
          </form>

          <footer style={{ marginTop: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
            Existing node? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', marginLeft: '0.5rem' }}>Sign In</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
