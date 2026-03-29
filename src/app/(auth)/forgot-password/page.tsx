'use client';

import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset probe sent. Please check your identity email.');
      setTimeout(() => router.push('/login'), 5000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Identity synchronization failed.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center animate-in" style={{ minHeight: '100vh', padding: '2rem' }}>
       <div className="container" style={{ maxWidth: '440px' }}>
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
           <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>RECOVER KEY</h1>
           <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>IDENTITY HUB PROTOCOL</p>
        </header>

        <div className="glass-card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Access Key Recovery</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Enter your email to receive a secure rotation link.
          </p>

          <form onSubmit={handleReset}>
            <div className="input-wrapper">
              <label className="input-label">Identity ID (Email)</label>
              <input 
                type="email" 
                className="input-field" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="identity@softbridgelabs.in"
              />
            </div>

            {message && (
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '12px', color: 'var(--success)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                ✅ {message}
              </div>
            )}

            {error && (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '12px', color: 'var(--error)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="premium-btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'TRANSMITTING...' : 'SEND RECOVERY LINK'}
            </button>
          </form>

          <footer style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
               Back to Authentication
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
