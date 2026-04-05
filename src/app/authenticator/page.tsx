'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as OTPAuth from 'otpauth';

// --- Types ---
interface AuthenticatorEntry {
  id: string;
  user_uid: string;
  issuer?: string;
  name?: string;
  secret: string;
  created_at: string;
}

// --- Component ---
export default function AuthenticatorPage() {
  const { user, profile, loading } = useAuth();
  const [entries, setEntries] = useState<AuthenticatorEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<AuthenticatorEntry | null>(null);
  
  // Form State
  const [newIssuer, setNewIssuer] = useState('');
  const [newName, setNewName] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [formError, setFormError] = useState('');

  // OTP Display State
  const [otpData, setOtpData] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const router = useRouter();

  const isPremium = profile?.premium || profile?.premium_global;

  const fetchEntries = useCallback(async () => {
    if (!user || !isPremium) return;
    try {
      setFetching(true);
      const res = await softbridgeApi.authenticator.list(user.uid);
      if (res.success) {
        setEntries(res.data || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch authenticator entries:", err);
    } finally {
      setFetching(false);
    }
  }, [user, isPremium]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && isPremium) {
      fetchEntries();
    }
  }, [user, loading, router, fetchEntries, isPremium]);

  // Handle OTP updates
  const updateOTPs = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    const secondsRemaining = 30 - (now % 30);
    setTimeLeft(secondsRemaining);

    const newOtpData: Record<string, string> = {};
    entries.forEach(entry => {
      try {
        const totp = new OTPAuth.TOTP({
          secret: entry.secret.replace(/\s+/g, '').toUpperCase(),
          digits: 6,
          period: 30,
          algorithm: 'SHA1'
        });
        newOtpData[entry.id] = totp.generate();
      } catch (e) {
        newOtpData[entry.id] = 'ERROR';
      }
    });
    setOtpData(newOtpData);
  }, [entries]);

  useEffect(() => {
    updateOTPs();
    const interval = setInterval(updateOTPs, 1000);
    return () => clearInterval(interval);
  }, [updateOTPs]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newSecret) {
      setFormError("Secret key is required.");
      return;
    }

    try {
      new OTPAuth.TOTP({ secret: newSecret.replace(/\s+/g, '').toUpperCase() });
    } catch (e) {
      setFormError("Invalid Secret Key format. Must be Base32.");
      return;
    }

    setAdding(true);
    setFormError('');
    try {
      const entryId = Math.random().toString(36).substring(2, 11);
      const res = await softbridgeApi.authenticator.add({
        user_uid: user.uid,
        id: entryId,
        issuer: newIssuer,
        name: newName,
        secret: newSecret
      });

      if (res.success) {
        setShowAddModal(false);
        setNewIssuer('');
        setNewName('');
        setNewSecret('');
        fetchEntries();
      } else {
        setFormError(res.message || "Failed to save entry.");
      }
    } catch (err: any) {
      setFormError(err.message || "Network error.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!user || !showDeleteConfirm) return;
    const id = showDeleteConfirm.id;
    setDeletingId(id);
    try {
      const res = await softbridgeApi.authenticator.delete(user.uid, id);
      if (res.success) {
        setEntries(prev => prev.filter(e => e.id !== id));
        setShowDeleteConfirm(null);
      } else {
        alert(res.message || "Deletion failed.");
      }
    } catch (err: any) {
      alert(err.message || "Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  const copyOTP = (id: string, code: string) => {
    if (code === 'ERROR') return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading || (fetching && isPremium && entries.length === 0)) return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.5rem' }}>
       <div className="bg-mesh" />
       <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
       <p style={{ color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.1em' }}>SYNCING SECURE NODES...</p>
    </div>
  );

  if (!loading && user && !isPremium) {
    return (
      <div className="page-wrapper">
        <div className="bg-mesh" />
        <Navbar />
        <main className="container flex-center" style={{ minHeight: 'calc(100vh - 80px)', paddingBottom: '100px' }}>
          <div className="glass-card animate-in" style={{ textAlign: 'center', maxWidth: '600px', padding: '4.5rem 3rem', background: '#fff' }}>
             <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>💎</div>
             <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>Premium Identity Node</h1>
             <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: '1.6' }}>
               Vault Authenticator is an elite security node exclusive to SoftBridge Premium members. Synchronize your 2FA secrets across all devices with encryption.
             </p>
             <Link href="/premium" className="premium-btn animate-spring" style={{ padding: '1.25rem 3.5rem', width: '100%', fontSize: '1.1rem' }}>
                UPGRADE TO PREMIUM
             </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="bg-mesh" />
      <Navbar />

      <main className="container" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', flexWrap: 'wrap', gap: '2rem' }}>
          <div className="animate-slide-right">
            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 800, letterSpacing: '-0.04em' }}>
              Vault <span className="accent-gradient">Authenticator</span>
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '0.5rem', maxWidth: '600px' }}>
              Secure TOTP node management for your ecosystem and external services.
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="premium-btn animate-spring" style={{ padding: '1rem 2.5rem' }}>
            <span>+</span> NEW IDENTITY
          </button>
        </header>

        {entries.length === 0 ? (
          <div className="glass-card animate-in" style={{ textAlign: 'center', padding: '100px 2rem', background: '#fff' }}>
             <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔐</div>
             <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>No Security Nodes Found</h2>
             <p style={{ color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
               Add your first 2FA secret to start generating secure one-time passwords within your SoftBridge Vault.
             </p>
             <button onClick={() => setShowAddModal(true)} className="outline-btn" style={{ padding: '1rem 3rem' }}>
               CONFIG NODE
             </button>
          </div>
        ) : (
          <div className="grid-auto animate-in" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {entries.map((entry, index) => (
              <div 
                key={entry.id} 
                className="glass-card animate-spring" 
                style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', overflow: 'hidden', animationDelay: `${index * 0.1}s`, cursor: 'pointer', background: '#fff' }}
                onClick={() => copyOTP(entry.id, otpData[entry.id])}
              >
                <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', background: timeLeft < 6 ? 'var(--error)' : 'var(--primary)', width: `${(timeLeft / 30) * 100}%`, transition: 'width 1s linear, background 0.3s ease' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                      {(entry.issuer?.[0] || entry.name?.[0] || 'V').toUpperCase()}
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(entry); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.3, transition: 'opacity 0.2s' }}>🗑️</button>
                </div>
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>{entry.issuer || "Unknown Issuer"}</h3>
                      {copiedId === entry.id && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '0.1em' }}>COPIED!</span>}
                   </div>
                   <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 500 }}>{entry.name || "Unnamed Account"}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                   <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.1em', color: timeLeft < 6 ? 'var(--error)' : 'var(--primary)', transition: 'color 0.3s ease' }}>
                     {otpData[entry.id]?.slice(0, 3)} {otpData[entry.id]?.slice(3)}
                   </div>
                   <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>{timeLeft}s</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)' }} onClick={() => !adding && setShowAddModal(false)}>
           <div className="glass-card animate-spring" style={{ width: '100%', maxWidth: '500px', padding: '3rem', background: '#fff' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Provision Node</h2>
              <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem' }}>Configure a new identity node within your vault.</p>
              <form onSubmit={handleAddEntry}>
                <div className="input-wrapper" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">ISSUER</label>
                  <input type="text" className="input-field" placeholder="e.g. GitHub, Google, SoftBridge" value={newIssuer} onChange={e => setNewIssuer(e.target.value)} />
                </div>
                <div className="input-wrapper" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">ACCOUNT NAME</label>
                  <input type="text" className="input-field" placeholder="e.g. john@example.com" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div className="input-wrapper" style={{ marginBottom: '2.5rem' }}>
                  <label className="input-label">SECRET KEY</label>
                  <input type="text" className="input-field" placeholder="Enter the 16+ digit secret key" value={newSecret} onChange={e => setNewSecret(e.target.value)} required />
                </div>
                {formError && <p style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>{formError}</p>}
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <button type="button" className="outline-btn" style={{ flex: 1, padding: '1rem' }} onClick={() => setShowAddModal(false)} disabled={adding}>CANCEL</button>
                   <button type="submit" className="premium-btn" style={{ flex: 1, padding: '1rem' }} disabled={adding}>{adding ? 'SYNCING...' : 'AUTHORIZE'}</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)' }} onClick={() => !deletingId && setShowDeleteConfirm(null)}>
           <div className="glass-card animate-spring" style={{ width: '100%', maxWidth: '440px', padding: '3.5rem 3rem', border: '1px solid rgba(239, 68, 68, 0.2)', background: '#fff' }} onClick={e => e.stopPropagation()}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '2rem' }}>⚠️</div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>Erase Identity?</h2>
              <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                You are about to permanently disconnect <strong style={{color: '#0f172a'}}>{showDeleteConfirm.issuer || 'this node'}</strong>. This action cannot be reversed within the ecosystem vault.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <button className="premium-btn" style={{ background: 'var(--error)', borderColor: 'var(--error)', padding: '1.25rem' }} onClick={handleDeleteEntry} disabled={!!deletingId}>{deletingId ? 'ERASING...' : 'CONFIRM ERASURE'}</button>
                 <button className="outline-btn" style={{ padding: '1.1rem' }} onClick={() => setShowDeleteConfirm(null)} disabled={!!deletingId}>ABORT ACTION</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
