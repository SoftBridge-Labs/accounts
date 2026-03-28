'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import GlassNotification from '@/components/GlassNotification';

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
    birthday: '',
    gender: 'Other',
    bio: ''
  });
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || '',
        birthday: profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : '',
        gender: profile.gender || 'Other',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh' }}>
       <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'pulse-slow 2s infinite' }}></div>
    </div>
  );
  
  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const payload: any = { ...formData, uid: user.uid };
      if (!payload.birthday) delete payload.birthday; // Remove empty string to prevent SQL error
      
      await softbridgeApi.updateAccountFull(payload);
      await refreshProfile();
      setNotification({ message: 'Identity synchronized successfully.', type: 'success' });
    } catch (err: any) {
      setNotification({ message: err.message || 'Identity synchronization failed.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      {notification && <GlassNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      
      <main className="container" style={{ paddingTop: '160px', paddingBottom: '80px' }}>
        <header className="animate-in" style={{ marginBottom: '4rem' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#0f172a' }}>Manage <span className="text-gradient">Identity</span></h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', marginTop: '0.5rem' }}>Global preferences for the SoftBridge ecosystem.</p>
        </header>

        <div className="grid-auto animate-in stagger-1" style={{ alignItems: 'start' }}>
          {/* Visual Preferences */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'center', background: '#fff' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#0f172a' }}>Visual Identity</h3>
            <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto' }}>
              <div style={{ position: 'absolute', inset: '-3px', border: '2px solid var(--primary)', borderRadius: '50%', boxShadow: '0 0 20px var(--primary-glow)', animation: 'pulse-slow 3s infinite' }}></div>
              <img src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.name || user.email}&background=6366f1&color=fff&bold=true`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--white)' }} />
            </div>
            <div className="input-wrapper">
                <label className="input-label" style={{ color: '#64748b' }}>Identity URL (Avatar)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  name="avatar_url" 
                  placeholder="https://..." 
                  value={formData.avatar_url} 
                  onChange={handleChange} 
                  style={{ fontSize: '0.85rem', background: '#f8fafc', color: '#0f172a' }}
                />
            </div>
          </div>

          {/* Identity Parameters */}
          <div className="glass-card" style={{ gridColumn: 'span 2', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.4rem', color: '#0f172a' }}>Parameters</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>AUTO-SYNC ENABLED</span>
            </div>
            
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <div className="input-wrapper">
                  <label className="input-label" style={{ color: '#64748b' }}>Identity Name</label>
                  <input type="text" className="input-field" name="name" value={formData.name} onChange={handleChange} required placeholder="Global Display Name" style={{ background: '#f8fafc', color: '#0f172a' }} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label" style={{ color: '#64748b' }}>Email Node (Read-Only)</label>
                  <input type="email" className="input-field" name="email" value={formData.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed', background: '#f8fafc', color: '#0f172a' }} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label" style={{ color: '#64748b' }}>Phone Node</label>
                  <input type="tel" className="input-field" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 890" style={{ background: '#f8fafc', color: '#0f172a' }} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label" style={{ color: '#64748b' }}>Temporal Node (Birthday)</label>
                  <input type="date" className="input-field" name="birthday" value={formData.birthday} onChange={handleChange} style={{ background: '#f8fafc', color: '#0f172a' }} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label" style={{ color: '#64748b' }}>Gender Parameter</label>
                  <select className="input-field" name="gender" value={formData.gender} onChange={handleChange} style={{ background: '#f8fafc', color: '#0f172a' }}>
                    <option value="Male">Male Identity</option>
                    <option value="Female">Female Identity</option>
                    <option value="Other">Custom Identity</option>
                  </select>
                </div>
              </div>

              <div className="input-wrapper" style={{ marginTop: '1.5rem' }}>
                <label className="input-label" style={{ color: '#64748b' }}>Identity Bio</label>
                <textarea className="input-field" name="bio" value={formData.bio} onChange={handleChange} style={{ height: '120px', resize: 'none', background: '#f8fafc', color: '#0f172a' }} maxLength={250} placeholder="Tell your global story..."></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem' }}>
                <button type="submit" className="premium-btn" disabled={saving}>
                   {saving ? 'SYNCHRONIZING...' : 'SAVE CHANGES'}
                </button>
                <button type="button" className="outline-btn-custom" onClick={() => router.push('/dashboard')} style={{ padding: '0.8rem 2rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, background: '#fff' }}>REVERT CHANGES</button>
              </div>
            </form>
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
