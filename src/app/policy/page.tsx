'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import GlassNotification from '@/components/GlassNotification';

export default function PolicyPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [inactivityDays, setInactivityDays] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const router = useRouter();

  const checkRateLimit = () => {
    const now = Date.now();
    if (now - lastUpdate < 30000) {
      const remains = Math.ceil((30000 - (now - lastUpdate)) / 1000);
      return `Lifecycle node cooling down. Retry in ${remains}s.`;
    }
    setLastUpdate(now);
    return null;
  };

  useEffect(() => {
    if (profile) {
      setInactivityDays((profile as any).inactivityDays || null);
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const error = checkRateLimit();
    if (error) {
      setNotification({ message: error, type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await softbridgeApi.updateUserDeletionPolicy({
        uid: user.uid,
        inactivityDays: inactivityDays
      });
      await refreshProfile();
      setNotification({ message: 'Lifecycle policy updated and synchronized.', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to update policy.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh' }}>
       <div className="bg-mesh" />
       <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="bg-mesh" />
      <Navbar />
      {notification && <GlassNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
        <header className="animate-in" style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800 }}>Account <span className="accent-gradient">Lifecycle</span></h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.15rem', marginTop: '0.8rem', fontWeight: 500 }}>Global identity duration and inactivity orchestration nodes.</p>
        </header>

        <div className="glass-card animate-in stagger-1" style={{ background: '#fff' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', color: '#0f172a' }}>Personal Deletion Policy</h3>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
            Customize the inactivity window before your SoftBridge identity nodes are automatically purged from the ecosystem.
            This value must be greater than the global system threshold.
          </p>

          <form onSubmit={handleUpdate}>
            <div className="input-wrapper">
              <label className="input-label">Inactivity Threshold (Days)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="input-field" 
                  value={inactivityDays === null ? '' : inactivityDays} 
                  onChange={(e) => setInactivityDays(e.target.value === '' ? null : parseInt(e.target.value) || 0)}
                  placeholder="Set custom days (e.g. 240)"
                  min="1"
                  style={{ paddingRight: '120px' }}
                />
                {!inactivityDays && (
                   <span style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>INHERITING GLOBAL</span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button type="submit" className="premium-btn" disabled={saving} style={{ width: '100%' }}>
                {saving ? 'SYNCHRONIZING...' : 'UPDATE LIFECYCLE NODE'}
              </button>
              
              {inactivityDays !== null && (
                <button 
                  type="button" 
                  className="outline-btn" 
                  style={{ width: '100%' }}
                  onClick={() => setInactivityDays(null)}
                >
                  RESET TO SYSTEM GLOBAL
                </button>
              )}
            </div>
          </form>

          <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>AUDIT NOTE</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.7' }}>
              Resetting to null means your identity will follow the master SoftBridge inactivity routine (Default: 180 days). Changes to this node are globally synchronized within 15 minutes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
