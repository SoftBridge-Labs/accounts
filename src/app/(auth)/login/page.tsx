'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Core Identity Initialization
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Multi-stage Identity Discovery (No backend login endpoint used)
      try {
        console.warn("Ecosystem Node sync-check triggered.");
        const profile = await softbridgeApi.getAccount(userCred.user.uid).catch(() => null);
        
        // Ensure backend node is initialized if missing
        if (!profile) {
            await softbridgeApi.updateAccountFull({ 
                uid: userCred.user.uid,
                email, 
                name: userCred.user.displayName || email.split('@')[0] 
            });
        }
      } catch (syncErr) {
        console.warn("Ecosystem synchronization delayed.");
      }

      // 3. Audit & Alert Logic
      let currentIp = '::1';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        currentIp = ipData.ip;
      } catch (err) { console.warn("IP fetch error, using fallback node."); }

      try {
        const pastLogs = await softbridgeApi.getActivity(userCred.user.uid);
        const recentLogs = Array.isArray(pastLogs) ? pastLogs.slice(0, 5) : [];
        const ipMatch = recentLogs.some(log => (log.ip || log.ip_address) === currentIp);

        if (!ipMatch) {
            await softbridgeApi.sendAlert({
              email,
              type: 'login',
              details: softbridgeApi.getAlertTemplate('Access Detected', `Access Node Authorized | IP: ${currentIp} | Device: Secure Engine`)
            }).catch(console.error);
        }
      } catch (auditErr) { console.error("Audit trail sync delayed."); }

      // 4. Trigger premium SuperLoader
      setShowSuperLoader(true);
    } catch (err: any) {
      // Brand-friendly Error Mapping (No "Firebase" mentions)
      let customError = 'Access denied. Please verify your identity credentials.';
      const code = err.code || '';
      
      if (code.includes('invalid-credential') || code.includes('wrong-password')) {
         customError = 'Identity Key mismatch. Please verify your access parameters.';
      } else if (code.includes('user-not-found')) {
         customError = 'Identity node not found. Would you like to initialize access?';
      } else if (code.includes('too-many-requests')) {
         customError = 'Ecosystem node over-saturation. Please wait before retrying.';
      }
      
      setError(customError);
      setLoading(false);
    }
  };

  if (showSuperLoader) {
    return <SuperLoader message="SYNCHRONIZING IDENTITY..." onComplete={() => router.push('/dashboard')} />;
  }

  return (
    <div className="flex-center animate-in" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="container" style={{ maxWidth: '440px' }}>
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
           <Link href="/" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.05em' }}>SOFTBRIDGE</Link>
           <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>IDENTITY HUB</p>
        </header>
        
        <div className="glass-card stagger-1" style={{ background: '#fff' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: '#0f172a' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>Authenticate to access your workspace hub.</p>
          
          <form onSubmit={handleLogin}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="input-label" style={{ color: '#64748b' }}>Access Key</label>
                <Link href="/auth?mode=resetPassword" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>FORGOT KEY?</Link>
              </div>
              <input 
                type="password" 
                className="input-field" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                style={{ background: '#f8fafc', color: '#0f172a' }}
              />
            </div>

            {error && (
              <div style={{ padding: '0.8rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                 <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" className="premium-btn" style={{ width: '100%', padding: '1.1rem' }} disabled={loading}>
              {loading ? 'SYNCHRONIZING...' : 'ACCESS ACCOUNT'}
            </button>
          </form>

          <footer style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            New identity? <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>Initialize Access</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
