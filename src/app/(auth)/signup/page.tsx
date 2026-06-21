'use client';

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, sendEmailVerification } from 'firebase/auth';
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

      // Send verification email immediately on signup
      try {
        await sendEmailVerification(userCred.user);
      } catch (verificationErr) {
        console.error("Verification email failed to send on signup:", verificationErr);
      }

      // Redirect immediately after Firebase account creation; backend sync should not block mobile UX.
      setShowSuperLoader(true);

      const normalizedEmail = email.toLowerCase().trim();

      // Sync identity and send provision alert in the background
      softbridgeApi.updateAccountFull({
        uid: userCred.user.uid,
        email: normalizedEmail,
        name
      }).then(() => {
        softbridgeApi.sendAlert({
          email: normalizedEmail,
          type: 'identity_provisioned',
          details: `Master Identity node initialized for ${name}.`
        }).catch((err) => console.error("Signup alert email failed:", err));
      }).catch((err) => console.error("Account registration sync failed:", err));
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
    <div className="flex-center animate-fade-in auth-shell" style={{ minHeight: '100vh', background: '#f8fafd', padding: '1.5rem', color: 'var(--text-main)' }}>
      <div className="bg-mesh" />
      <div className="auth-orb one" style={{ opacity: 0.5 }} />
      <div className="auth-orb two" style={{ opacity: 0.5 }} />
      
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
              
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '0.8rem', color: '#fff' }}>Get Started with Us</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', marginBottom: '3.5rem', fontWeight: 500 }}>Complete these easy steps to register your account.</p>
              
              <div className="steps-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', color: '#0f172a', padding: '0.9rem 1.1rem', borderRadius: '16px', fontWeight: 700, fontSize: '0.88rem', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>1</span>
                  Sign up your account
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '0.9rem 1.1rem', borderRadius: '16px', fontWeight: 700, fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>2</span>
                  Verify your identity
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '0.9rem 1.1rem', borderRadius: '16px', fontWeight: 700, fontSize: '0.88rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>3</span>
                  Complete your profile
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form Panel */}
          <div className="auth-split-form-panel">
            <div style={{ width: '100%', maxWidth: '370px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Sign Up Account</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '2.5rem', fontWeight: 500 }}>Enter your personal data to create your account.</p>

              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="input-label" style={{ marginBottom: '0.45rem' }}>Your Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    autoComplete="name"
                    placeholder="eg. John Francisco"
                    className="input-field"
                    style={{ borderRadius: '14px', padding: '1rem 1.1rem' }}
                  />
                </div>

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
                  <label className="input-label" style={{ marginBottom: '0.45rem' }}>New Access Key</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Enter your password"
                    className="input-field"
                    style={{ borderRadius: '14px', padding: '1rem 1.1rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem', fontWeight: 500 }}>Must be at least 6 characters.</span>
                </div>

                {error && (
                  <div style={{ padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', color: '#f87171', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}>
                     <span>⚠️</span> {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="premium-btn" style={{ width: '100%', borderRadius: '14px', padding: '1rem', fontSize: '0.92rem', fontWeight: 700 }}>
                  {loading ? 'Initializing...' : 'Sign Up'}
                </button>
              </form>

              <footer style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                Already have an account? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', marginLeft: '0.3rem' }}>Log in</Link>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
