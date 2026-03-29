'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function DashboardContent() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh', gap: '1.5rem', flexDirection: 'column' }}>
       <div className="bg-mesh" />
       <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
       <p style={{ color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.1em' }}>SYNCING IDENTITY NODES...</p>
    </div>
  );

  if (!user) return null;

  const isPremium = profile?.premium || profile?.premium_global;

  return (
    <div className="page-wrapper">
      <div className="bg-mesh" />
      <Navbar />
      
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <header className="animate-in" style={{ marginBottom: '3.5rem' }}>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', marginBottom: '0.5rem', fontWeight: 800, color: '#0f172a' }}>
            Identity <span className="accent-gradient">Hub</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 'clamp(1rem, 1.2vw, 1.2rem)', fontWeight: 500 }}>Global control center for your SoftBridge ecosystem nodes.</p>
        </header>

        {setupHelp && profile && !profile.phone && (
          <div className="glass-card animate-in stagger-1" style={{ marginBottom: '3rem', borderLeft: '4px solid var(--primary)', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <h3 style={{ color: 'var(--primary)', marginBottom: '0.50rem', fontSize: '1.25rem' }}>🚀 Optimization Recommended</h3>
                <p style={{ color: 'var(--text-dim)', fontWeight: 500 }}>Complete your identity parameters to unlock ecosystem-wide phone verification.</p>
              </div>
              <Link href="/profile" className="premium-btn" style={{ padding: '0.8rem 1.5rem', fontSize: '0.85rem' }}>Optimize Profile</Link>
            </div>
          </div>
        )}

        <div className="grid-auto animate-in stagger-2">
          {/* Profile Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', padding: '3px', position: 'relative' }}>
                <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.name || user.email}&background=4f46e5&color=fff&bold=true`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff' }} />
                <div style={{ position: 'absolute', bottom: '0', right: '0', width: '22px', height: '22px', background: user.emailVerified ? 'var(--success)' : 'var(--warning)', borderRadius: '50%', border: '4px solid #fff' }}></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.25rem' }}>STATUS</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: user.emailVerified ? 'var(--success)' : 'var(--warning)' }}>
                  {user.emailVerified ? 'VERIFIED' : 'PENDING'}
                </p>
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 1.8rem)', marginBottom: '0.25rem', color: '#0f172a' }}>{profile?.name || 'Incomplete Identity'}</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', fontWeight: 600 }}>{user.email}</p>
            </div>
            <Link href="/profile" className="outline-btn" style={{ fontSize: '0.9rem', width: '100%' }}>Identity Preferences</Link>
          </div>

          {/* Subscription Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 1.8rem)', color: '#0f172a' }}>Tier Status</h3>
              {isPremium ? (
                <span className="accent-gradient" style={{ fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>MASTER IDENTITY</span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>CORE ACCESS</span>
              )}
            </div>
            <p style={{ marginBottom: '2.5rem', color: 'var(--text-dim)', lineHeight: '1.6', fontSize: '1rem' }}>
              {isPremium 
                ? `Active worldwide elite node until ${profile.premiumUntil ? new Date(profile.premiumUntil).toLocaleDateString() : 'Active Session'}` 
                : 'Upgrade to unlock priority identity processing and ad-free experience ecosystem-wide.'}
            </p>
            <Link href="/premium" className="premium-btn" style={{ width: '100%', marginTop: 'auto', fontSize: '0.9rem' }}>
               {isPremium ? 'Manage Tiers' : 'Upgrade Account'}
            </Link>
          </div>

          {/* Activity Full Width */}
          <div className="glass-card" style={{ gridColumn: 'min(100%, 1 / -1)', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 1.8rem)', color: '#0f172a' }}>Audit Trails</h3>
              <Link href="/security" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800, textDecoration: 'none', letterSpacing: '0.05em' }}>FULL AUDIT</Link>
            </div>
            {activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activity.slice(0, 5).map((act, i) => {
                  const type = act.type || act.action || 'IDENTITY_EVENT';
                  const details = act.details || act.ip || act.ip_address || 'Authorized Node Access';
                  const timestamp = act.timestamp || act.event_time || act.createdAt || act.created_at;
                  
                  return (
                    <div key={i} style={{ padding: '1.4rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                         <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            {type.toLowerCase().includes('login') ? '🔑' : '📡'}
                          </div>
                         <div>
                            <p style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.01em', color: '#0f172a' }}>{type.replace('_', ' ').toUpperCase()}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>{details}</p>
                         </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{timestamp ? new Date(timestamp).toLocaleTimeString() : 'RECENT'}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</p>
                <p style={{ fontWeight: 600 }}>No ecosystem audit trails detected.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
       <div className="flex-center" style={{ height: '100vh' }}>
          <div className="bg-mesh" />
          <p style={{ color: 'var(--text-dim)', fontWeight: 600 }}>INITIALIZING HUB...</p>
       </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
