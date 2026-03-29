'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import DeleteModal from '@/components/DeleteModal';
import { deleteUser } from 'firebase/auth';

export default function SecurityPage() {
  const { user, profile, loading, logout } = useAuth();
  const [activity, setActivity] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchActivity() {
      if (user) {
        try {
          const data = await softbridgeApi.getActivity(user.uid);
          setActivity(data || []);
        } catch (err) {
          console.error("Failed to fetch activity:", err);
        } finally {
          setFetching(false);
        }
      }
    }
    fetchActivity();
  }, [user?.uid]);

  if (loading || fetching) return (
     <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-dark)' }}>
        <div className="bg-mesh" />
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
     </div>
  );
  
  if (!user) return null;

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await softbridgeApi.deleteAccount(user.uid);
      try {
        await deleteUser(user);
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/requires-recent-login') {
            alert("Security Node Timeout: Please re-authenticate your session before purging your identity permanently.");
            setDeleting(false);
            setShowDeleteModal(false);
            return;
        }
      }
      await logout();
      router.push('/signup?reason=account_deleted');
    } catch (err: any) {
        alert("Identity purge failed: " + err.message);
    } finally {
        setDeleting(false);
        setShowDeleteModal(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="bg-mesh" />
      <Navbar />
      {showDeleteModal && (
        <DeleteModal 
            onConfirm={handleDeleteAccount} 
            onCancel={() => setShowDeleteModal(false)}
            isDeleting={deleting}
        />
      )}

      <main className="container" style={{ paddingTop: 'min(120px, 15vh)', paddingBottom: '80px' }}>
        <header className="animate-slide-right" style={{ marginBottom: '3.5rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 800, letterSpacing: '-0.04em' }}>Integrity <span className="accent-gradient">Audit</span></h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '0.5rem', maxWidth: '600px' }}>Full transparency for your ecosystem security nodes and identity verification trails.</p>
        </header>

        <div className="grid-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '2rem', alignItems: 'start' }}>
          {/* Detailed Activity Logs */}
          <div className="glass-card animate-spring" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', background: '#fff' }}>
               <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Audit Trails</h3>
               <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.15em', background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '100px' }}>{activity.length} NODES LOGGED</span>
            </div>
            {activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
                {activity.map((act, i) => {
                  const type = act.type || act.action || 'IDENTITY_EVENT';
                  const details = act.details || act.ip || act.ip_address || 'Authorized Node Access';
                  const timestamp = act.timestamp || act.event_time || act.createdAt || act.created_at;

                  return (
                    <div key={i} style={{ padding: '1.5rem 2rem', borderBottom: i === activity.length - 1 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '1rem', transition: '0.2s ease' }} className="activity-item">
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', minWidth: 0 }}>
                         <div style={{ width: '40px', height: '40px', minWidth: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid rgba(99, 102, 241, 0.1)' }}>{type.toLowerCase().includes('login') ? '🔑' : '📡'}</div>
                         <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <p style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{type.replace('_', ' ').toUpperCase()}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{details}</p>
                         </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{timestamp ? new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'RECENT'}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
                <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)', background: '#fff' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛡️</p>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Active audit node is currently empty.</p>
                </div>
            )}
          </div>

          {/* Privacy & Danger Zone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card animate-spring" style={{ animationDelay: '0.1s' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 800 }}>Node Status</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 700 }}>Verified Link</span>
                    <span style={{ color: user.emailVerified ? 'var(--success)' : 'var(--error)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em' }}>{user.emailVerified ? 'SYNCHRONIZED' : 'UNVERIFIED'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 700 }}>Access Tier</span>
                    <span style={{ color: profile?.premium || profile?.premium_global ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em' }}>{(profile?.premium || profile?.premium_global) ? 'PREMIUM ACCESS' : 'CORE ACCESS'}</span>
                </div>
                <button 
                  className="outline-btn" 
                  style={{ width: '100%', marginTop: '2.5rem', fontSize: '0.85rem', padding: '1rem' }}
                  onClick={async () => {
                      await softbridgeApi.forgotPassword(user.email!);
                      alert("Secret access rotation link transmitted to identity email.");
                  }}
                >
                  ROTATE ACCESS KEY
                </button>
            </div>

            <div className="glass-card animate-spring" style={{ border: '1px solid rgba(239, 68, 68, 0.2)', animationDelay: '0.2s' }}>
                <h3 style={{ marginBottom: '0.75rem', color: 'var(--error)', fontSize: '1.2rem', fontWeight: 800 }}>Identity Purge</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: '1.6', fontWeight: 500 }}>Permanently disconnect your identity from the SoftBridge system. This action results in full data erasure.</p>
                <button className="premium-btn" style={{ width: '100%', background: 'var(--error)', borderColor: 'var(--error)', padding: '1.1rem', borderRadius: '16px', fontSize: '0.85rem' }} onClick={() => setShowDeleteModal(true)}>
                    TERMINATE IDENTITY
                </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
