'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function DashboardContent() {
  const { user, profile, loading } = useAuth();
  const [activity, setActivity] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const setupHelp = searchParams.get('setupHelp') === 'true';

  useEffect(() => {
    async function fetchData() {
      if (user) {
        try {
          const activityData = await softbridgeApi.getActivity(user.uid);
          setActivity(activityData || []);
        } catch (err) {
          console.error("Failed to fetch activity:", err);
        }
      }
    }
    fetchData();
  }, [user?.uid]);

  if (loading) return (
    <div className="flex-center animate-in" style={{ height: '100vh', gap: '1rem', flexDirection: 'column' }}>
       <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'pulse-slow 2s infinite' }}></div>
       <p style={{ color: '#64748b', fontWeight: 600 }}>Syncing Identity Hub...</p>
    </div>
  );

  if (!user) return null;

  const isPremium = profile?.premium || profile?.premium_global;

  return (
    <div className="page-wrapper" style={{ background: '#fafafa' }}>
      <Navbar />
      
      <main className="container" style={{ paddingTop: '160px', paddingBottom: '80px' }}>
        <header className="animate-in" style={{ marginBottom: '4rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem', fontWeight: 800, color: '#0f172a' }}>
            Identity <span className="text-gradient">Hub</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.25rem', fontWeight: 500 }}>Global control center for your SoftBridge nodes.</p>
        </header>

        {setupHelp && profile && !profile.phone && (
          <div className="glass-card animate-in stagger-1" style={{ marginBottom: '3rem', borderLeft: '4px solid #6366f1', background: '#fff' }}>
            <h3 style={{ color: '#6366f1', marginBottom: '0.75rem' }}>🚀 Identity Optimization Required</h3>
            <p style={{ marginBottom: '2rem', color: '#475569', fontWeight: 500 }}>Complete your profile parameters to unlock ecosystem-wide phone verification.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/profile" className="premium-btn" style={{ padding: '0.8rem 2rem', fontSize: '0.9rem', borderRadius: '12px' }}>Optimize Profile</Link>
            </div>
          </div>
        )}

        <div className="grid-auto">
          {/* Profile Card */}
          <div className="glass-card animate-in stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', padding: '3px' }}>
                <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.name || user.email}&background=6366f1&color=fff&bold=true`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff' }} />
              </div>
              <span style={{ 
                padding: '6px 12px', 
                borderRadius: '100px', 
                background: user.emailVerified ? '#f0fdf4' : '#fef2f2', 
                fontSize: '0.7rem', 
                border: user.emailVerified ? '1px solid #16a34a' : '1px solid #ef4444', 
                fontWeight: 800, 
                color: user.emailVerified ? '#16a34a' : '#ef4444' 
              }}>
                {user.emailVerified ? 'VERIFIED' : 'UNVERIFIED'}
              </span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>{profile?.name || 'Incomplete Identity'}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>{user.email}</p>
            </div>
            <Link href="/profile" className="outline-btn-custom" style={{ width: '100%', textAlign: 'center', fontSize: '0.9rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', color: '#0f172a', fontWeight: 700 }}>Identity Preferences</Link>
          </div>

          {/* Subscription Card */}
          <div className="glass-card animate-in stagger-3" style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#0f172a' }}>Tier Status</h3>
              {isPremium ? (
                <span style={{ background: '#22c55e', color: 'white', padding: '6px 14px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>PREMIUM PRO</span>
              ) : (
                <span style={{ border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>CORE ACCESS</span>
              )}
            </div>
            <p style={{ marginBottom: '2rem', color: '#475569', lineHeight: '1.6', fontWeight: 500 }}>{isPremium ? 'Active worldwide elite node until ' + (profile.premiumUntil ? new Date(profile.premiumUntil).toLocaleDateString() : (profile.premium_until ? new Date(profile.premium_until).toLocaleDateString() : 'N/A')) : 'Upgrade to unlock priority identity processing across all SoftBridge Labs nodes.'}</p>
            <Link href="/premium" className="premium-btn" style={{ width: '100%', marginTop: 'auto', fontSize: '0.9rem', borderRadius: '12px' }}>{isPremium ? 'Manage Tiers' : 'Upgrade to Pro'}</Link>
          </div>

          {/* Activity Full Width */}
          <div className="glass-card animate-in stagger-3" style={{ gridColumn: 'span 2', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#0f172a' }}>Audit History</h3>
              <Link href="/security" style={{ color: '#6366f1', fontSize: '0.85rem', fontWeight: 800 }}>FULL AUDIT</Link>
            </div>
            {activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activity.slice(0, 4).map((act, i) => {
                  const type = act.type || act.action || 'Event';
                  const details = act.details || act.ip || act.ip_address || 'Details';
                  const timestamp = act.timestamp || act.event_time || act.createdAt || act.created_at;
                  
                  return (
                    <div key={i} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                         <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>{type.toLowerCase().includes('login') ? '🔑' : '🛡️'}</div>
                         <div>
                            <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{type.replace('_', ' ').toUpperCase()}</p>
                            <p style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>{details}</p>
                         </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800 }}>{timestamp ? new Date(timestamp).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '3rem 0', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>No audit trails detected.</div>
            )}
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

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex-center" style={{ height: '100vh' }}>Optimizing Identity Hub...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
