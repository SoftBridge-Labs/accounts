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

  if (loading || fetching) return <div className="flex-center" style={{ height: '100vh' }}><div className="pulse-slow" style={{ color: '#64748b', fontWeight: 700 }}>Auditing Identity Nodes...</div></div>;
  
  if (!user) return null;

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // 1. Delete from Backend Hub
      await softbridgeApi.deleteAccount(user.uid);
      
      // 2. Delete from Primary Identity Provider (Firebase)
      try {
        await deleteUser(user);
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/requires-recent-login') {
            alert("Security Node Timeout: Please re-authenticate your session before purging your identity permanently.");
            setDeleting(false);
            setShowDeleteModal(false);
            return;
        }
        console.warn("External provider purge failed, local identity removed.");
      }

      // 3. Complete Termination
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
    <div className="page-wrapper" style={{ background: '#fafafa' }}>
      <Navbar />
      {showDeleteModal && (
        <DeleteModal 
            onConfirm={handleDeleteAccount} 
            onCancel={() => setShowDeleteModal(false)}
            isDeleting={deleting}
        />
      )}

      <main className="container" style={{ paddingTop: '160px', paddingBottom: '80px' }}>
        <header className="animate-in" style={{ marginBottom: '4rem' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#0f172a' }}>Integrity <span className="text-gradient">Audit</span></h1>
          <p style={{ color: '#64748b', fontSize: '1.2rem', marginTop: '0.5rem', fontWeight: 600 }}>Full transparency for your ecosystem security.</p>
        </header>

        <div className="grid-auto animate-in stagger-1" style={{ alignItems: 'start', gridTemplateColumns: 'minmax(300px, 1fr) 350px' }}>
          {/* Detailed Activity Logs */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
               <h3 style={{ fontSize: '1.4rem', color: '#0f172a' }}>Audit Trails</h3>
               <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>{activity.length} NODES LOGGED</span>
            </div>
            {activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activity.map((act, i) => {
                  const type = act.type || act.action || 'Event';
                  const details = act.details || act.ip || act.ip_address || 'Details';
                  const timestamp = act.timestamp || act.event_time || act.createdAt || act.created_at;

                  return (
                    <div key={i} style={{ padding: '2rem 2.5rem', borderBottom: i === activity.length - 1 ? 'none' : '1px solid #f1f5f9', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                         <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>{type.toLowerCase().includes('login') ? '🔑' : '🛡️'}</div>
                         <div>
                            <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{type.replace('_', ' ').toUpperCase()}</p>
                            <p style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.2rem', fontWeight: 600 }}>{details}</p>
                         </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800 }}>{timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
                <div style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Active audit node is empty.</div>
            )}
          </div>

          {/* Privacy & Danger Zone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card" style={{ background: '#fff' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#0f172a' }}>Node Status</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Verified Link</span>
                    <span style={{ color: user.emailVerified ? '#16a34a' : '#ef4444', fontWeight: 800, fontSize: '0.85rem' }}>{user.emailVerified ? 'SYNCED' : 'UNVERIFIED'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Access Tier</span>
                    <span style={{ color: profile?.premium || profile?.premium_global ? '#6366f1' : '#64748b', fontWeight: 800, fontSize: '0.85rem' }}>{(profile?.premium || profile?.premium_global) ? 'PREMIUM' : 'CORE'}</span>
                </div>
                <button 
                  className="outline-btn-custom" 
                  style={{ width: '100%', marginTop: '2.5rem', fontSize: '0.9rem', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 700 }}
                  onClick={async () => {
                      await softbridgeApi.forgotPassword(user.email!);
                      alert("Secret access rotation link transmitted to identity email.");
                  }}
                >
                  Rotate Access Key
                </button>
            </div>

            <div className="glass-card" style={{ borderColor: '#fca5a5', background: '#fff' }}>
                <h3 style={{ marginBottom: '1rem', color: '#ef4444' }}>Identity Purge</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2.5rem', lineHeight: '1.5', fontWeight: 500 }}>Permanently disconnect your identity from the SoftBridge system. This action is terminal.</p>
                <button className="premium-btn" style={{ width: '100%', background: '#ef4444', padding: '1.2rem', borderRadius: '12px' }} onClick={() => setShowDeleteModal(true)}>
                    PURGE IDENTITY
                </button>
            </div>
          </div>
        </div>
      </main>
      <style jsx>{`
        .outline-btn-custom:hover {
            background: #fdfdfd !important;
            border-color: #0f172a !important;
            transform: translateY(-4px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
