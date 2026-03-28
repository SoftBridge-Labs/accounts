'use client';

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; 
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Core Identity Initialization
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });

      // 2. Ecosystem Identity Bridging (No /register endpoint used)
      try {
        const exists = await softbridgeApi.getAccount(userCred.user.uid).catch(() => null);
        if (!exists) {
            // Initialize backend via account endpoint directly
            await softbridgeApi.updateAccountFull({ 
                uid: userCred.user.uid,
                email, 
                name 
            });
            
            await softbridgeApi.sendAlert({
              email,
              type: 'account_created',
              details: softbridgeApi.getAlertTemplate('Identity Initialized', `Identity Nodes successfully bridged. Welcome to the ecosystem, ${name}.`)
            }).catch(() => null);
        }
      } catch (apiErr) {
        console.warn("Ecosystem synchronization delayed.");
      }
      
      // 3. Trigger premium SuperLoader
      setShowSuperLoader(true);
    } catch (err: any) {
      // Brand-friendly Error Mapping (No "Firebase" mentions)
      let customError = 'Identification failed. Please verify your entry parameters.';
      const code = err.code || '';
      
      if (code.includes('email-already-in-use')) {
         customError = 'Identity ID is already mapped to an existing node. Please authenticate.';
      } else if (code.includes('weak-password')) {
         customError = 'Access Key is too simple. For your protection, use a complex string.';
      } else if (code.includes('invalid-email')) {
         customError = 'Identity format is invalid. Ensure nodes are properly formatted.';
      }
      
      setError(customError);
      setLoading(false);
    }
  };

  if (showSuperLoader) {
    return <SuperLoader message="INITIALIZING IDENTITY NODE..." onComplete={() => router.push('/dashboard?setupHelp=true')} />;
  }

  return (
    <div className="flex-center animate-in" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="container" style={{ maxWidth: '440px' }}>
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
           <Link href="/" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.05em' }}>SOFTBRIDGE</Link>
           <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>IDENTITY HUB</p>
        </header>

        <div className="glass-card stagger-1" style={{ background: '#fff' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: '#0f172a' }}>Identity Initialization</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>Your single identity for all Bridge applications.</p>
          
          <form onSubmit={handleSignup}>
            <div className="input-wrapper">
              <label className="input-label" style={{ color: '#64748b' }}>Identity Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="John Doe"
                style={{ background: '#f8fafc', color: '#0f172a' }}
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label" style={{ color: '#64748b' }}>Identity ID (Email)</label>
              <input 
                type="email" 
                className="input-field" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="identity@softbridgelabs.in"
                style={{ background: '#f8fafc', color: '#0f172a' }}
              />
            </div>
            
            <div className="input-wrapper">
              <label className="input-label" style={{ color: '#64748b' }}>New Access Key</label>
              <input 
                type="password" 
                className="input-field" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Min. 8 characters"
                style={{ background: '#f8fafc', color: '#0f172a' }}
              />
            </div>

            {error && (
              <div style={{ padding: '0.8rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                 <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" className="premium-btn" style={{ width: '100%', padding: '1.1rem' }} disabled={loading}>
              {loading ? 'INITIALIZING...' : 'INITIALIZE IDENTITY'}
            </button>
          </form>

          <footer style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            Existing identity? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Authenticate Access</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
