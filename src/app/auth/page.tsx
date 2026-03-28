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
  const [status, setStatus] = useState('Verifying your identity nodes...');
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(''); // 'confirm' for resetPassword

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!oobCode || !mode) {
      setStatus('Identity verification failed. Invalid access probe.');
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
    <div className="flex-center animate-in" style={{ minHeight: '100vh', padding: '2rem' }}>
      <Navbar />
      <div className="container" style={{ maxWidth: '440px', marginTop: '100px' }}>
        <div className="glass-card">
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Identity Security</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>{status}</p>

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
              {error && <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}>⚠️ {error}</div>}
              <button type="submit" className="premium-btn" style={{ width: '100%', padding: '1.1rem' }}>ROTATE ACCESS KEY</button>
            </form>
          )}

          {step === 'done' && (
            <Link href="/login" className="premium-btn" style={{ width: '100%', padding: '1.1rem', textAlign: 'center' }}>ACCESS ACCOUNT</Link>
          )}

          {!step && !oobCode && (
            <Link href="/" className="outline-btn" style={{ width: '100%', display: 'block', textAlign: 'center' }}>BACK TO SAFETY</Link>
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
