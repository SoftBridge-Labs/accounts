'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

function AuthActionHandlerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Verifying your account...');
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(''); // 'confirm' for resetPassword

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!oobCode || !mode) {
      setStatus('Verification failed. This link may be invalid or expired.');
      return;
    }

    const handleAction = async () => {
      try {
        if (mode === 'verifyEmail') {
           await applyActionCode(auth, oobCode);
           setStatus('Email node verified. Synchronizing world identity...');
           setTimeout(() => router.push('/dashboard'), 2500);
        } else if (mode === 'resetPassword') {
           setStep('confirm');
           setStatus('Verification successful. Please rotate your access key.');
        }
      } catch (err: any) {
        setStatus('Identity synchronization failed.');
        setError(err.message || 'Action code expired or already utilized.');
      }
    };
    
    handleAction();
  }, [mode, oobCode, router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    
    try {
      await softbridgeApi.confirmPasswordReset(oobCode, newPassword);
      setStatus('Access key rotated. Identity secured.');
      setStep('done');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Key rotation failed. Please verify link integrity.');
    }
  };

  return (
    <div className="flex-center animate-fade-in auth-shell" style={{ minHeight: '100vh', background: '#f8fafd', padding: '1rem' }}>
      <div className="bg-mesh" />
      <div className="auth-orb one" />
      <div className="auth-orb two" />
      
      <div className="container" style={{ maxWidth: '480px', position: 'relative', zIndex: 1 }}>
        <div className="auth-card-mobile animate-spring" style={{ padding: '3.5rem 2.5rem', background: '#fff' }}>
          <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
             <h1 className="accent-gradient" style={{ fontSize: 'min(3rem, 12vw)', fontWeight: 800, letterSpacing: '-0.06em' }}>SoftBridge</h1>
             <p style={{ color: '#94a3b8', marginTop: '0.2rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase' }}>IDENTITY SECURITY</p>
          </header>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {mode === 'verifyEmail' ? '🛡️' : '🔑'}
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.6', fontWeight: 500 }}>{status}</p>
          </div>

          {step === 'confirm' && (
            <form onSubmit={handleReset}>
              <div className="input-wrapper">
                <label className="input-label">New Access Key (Password)</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  placeholder="Min. 8 characters"
                />
              </div>
              {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid #fee2e2', borderRadius: '16px', color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', gap: '0.6rem', alignItems: 'center', fontWeight: 600 }}>
                   <span style={{ fontSize: '1.2rem' }}>⚠️</span> {error}
                </div>
              )}
              <button type="submit" className="premium-btn" style={{ width: '100%', minHeight: '3.5rem', fontSize: '1rem' }}>ROTATE ACCESS KEY</button>
            </form>
          )}

          {step === 'done' && (
            <Link href="/login" className="premium-btn" style={{ width: '100%', minHeight: '3.5rem', fontSize: '1rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ACCESS ACCOUNT</Link>
          )}

          {!step && !oobCode && (
            <Link href="/" className="outline-btn" style={{ width: '100%', minHeight: '3.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>BACK TO SAFETY</Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthActionHandler() {
  return (
    <Suspense fallback={<div className="flex-center" style={{ height: '100vh' }}>Verifying Security Nodes...</div>}>
      <AuthActionHandlerContent />
    </Suspense>
  );
}
