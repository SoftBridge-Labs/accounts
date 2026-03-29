'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import DeleteModal from '@/components/DeleteModal';
import { deleteUser } from 'firebase/auth';
import SecurityModal from '@/components/SecurityModal';

// Adaptive Rate limit helper
const rateLimitNodes: Record<string, { count: number, last: number }> = {};
const checkRateLimit = (key: string) => {
  const now = Date.now();
  const node = rateLimitNodes[key] || { count: 0, last: 0 };
  
  // Base cooldown 30s, doubles each time up to 10 mins
  const baseCooldown = 30000;
  const currentCooldown = Math.min(baseCooldown * Math.pow(2, node.count), 600000);

  if (now - node.last < currentCooldown) {
    const remains = Math.ceil((currentCooldown - (now - node.last)) / 1000);
    return `Security node cooling down. Retry in ${remains}s.`;
  }
  
  rateLimitNodes[key] = { count: node.count + 1, last: now };
  return null;
};

export default function SecurityPage() {
  const { user, profile, loading, logout } = useAuth();
  const [activity, setActivity] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
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

  const confirmRotation = async () => {
    if (!user) return;
    const error = checkRateLimit('rotation');
    if (error) {
       alert(error);
       setShowRotationModal(false);
       return;
    }

    setRotating(true);
    try {
      await softbridgeApi.forgotPassword(user.email!);
      alert("Secret access rotation link transmitted to identity email.");
    } catch (e) {
      alert("Failed to trigger password rotation.");
    } finally {
      setRotating(false);
      setShowRotationModal(false);
    }
  };

  if (loading || fetching) return (
     <div className="flex-center" style={{ height: '100vh' }}>
        <div className="bg-mesh" />
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
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
      
      {showRotationModal && (
        <SecurityModal 
          title="Rotate Access Key" 
          message="A secure password reset link will be transmitted to your registered identity email. This node will expire after 1 hour." 
          confirmText="TRANSMIT RESET LINK"
          onConfirm={confirmRotation} 
          onCancel={() => setShowRotationModal(false)}
          isLoading={rotating}
        />
      )}

      <main className="container" style={{ paddingTop: 'min(120px, 15vh)', paddingBottom: '80px' }}>
        <header className="animate-slide-right" style={{ marginBottom: '3.5rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 800, letterSpacing: '-0.04em' }}>Integrity <span className="accent-gradient">Audit</span></h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '0.5rem', maxWidth: '600px' }}>Full transparency for your ecosystem security nodes and identity verification trails.</p>
        </header>

        <div className="grid-auto" style={{ alignItems: 'start' }}>
          {/* Detailed Activity Logs */}
          <div className="glass-card animate-spring" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#fff' }}>
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
                    <div key={i} style={{ padding: '1.5rem 2rem', borderBottom: i === activity.length - 1 ? 'none' : '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '1rem' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card animate-spring" style={{ background: '#fff' }}>
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
                  onClick={() => setShowRotationModal(true)}
                >
                  ROTATE ACCESS KEY
                </button>
            </div>

            <div className="glass-card animate-spring" style={{ border: '1px solid rgba(239, 68, 68, 0.1)', background: '#fff' }}>
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
