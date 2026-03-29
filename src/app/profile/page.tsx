'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import GlassNotification from '@/components/GlassNotification';
import { handleProfilePhotoChange } from '@/app/actions/imageUpload';

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
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setFormData({
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        avatar_url: p.avatar_url || '',
        birthday: p.birthday ? new Date(p.birthday).toISOString().split('T')[0] : '',
        gender: p.gender || 'Other',
        bio: p.bio || ''
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
       <div className="bg-mesh" />
       <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
    </div>
  );
  
  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Direct resize/preview node setup
    setUploading(true);
    setNotification(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Custom folder setup
        const folder = `softbridge/profiles/${user.uid}`;
        
        const result = await handleProfilePhotoChange(base64, formData.avatar_url, folder);
        
        if (result.success && result.url) {
          setFormData(prev => ({ ...prev, avatar_url: result.url! }));
          setNotification({ message: 'Visual Node updated successfully.', type: 'success' });
        } else {
          setNotification({ message: result.error || 'Failed to update Visual Node.', type: 'error' });
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setNotification({ message: 'Error processing image.', type: 'error' });
      setUploading(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const payload: any = { ...formData, uid: user.uid };
      if (!payload.birthday) delete payload.birthday; 
      
      await softbridgeApi.updateAccountFull(payload);
      
      // Notify user of identity synchronization
      try {
        await softbridgeApi.sendAlert({
          email: user.email!,
          type: 'identity_synchronized',
          details: `Parameters updated for ${formData.name}. Node values have been globally synchronized.`
        }).catch(() => null);
      } catch (e) {}

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
      <div className="bg-mesh" />
      <Navbar />
      {notification && <GlassNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <header className="animate-in" style={{ marginBottom: '3.5rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, color: '#0f172a' }}>Manage <span className="accent-gradient">Identity</span></h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', fontWeight: 500 }}>Global preferences for the SoftBridge identity nodes.</p>
        </header>

        <div className="grid-auto animate-in stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
          {/* Visual Preferences */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', textAlign: 'center', background: '#fff' }}>
            <h3 style={{ fontSize: '1.6rem', color: '#0f172a' }}>Visual Node</h3>
            
            <div 
              style={{ 
                position: 'relative', 
                width: '140px', 
                height: '140px', 
                margin: '0 auto',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
              onClick={triggerUpload}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ position: 'absolute', inset: '-8px', border: '2px dashed var(--primary)', borderRadius: '50%', opacity: 0.2 }}></div>
              <img 
                src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.name || user.email}&background=4f46e5&color=fff&bold=true`} 
                alt="Avatar" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '4px solid #fff', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  filter: uploading ? 'blur(2px) grayscale(0.5)' : 'none'
                }} 
              />
              
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: uploading ? 1 : 0,
                transition: 'opacity 0.2s ease',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                {uploading ? 'SYNCING...' : 'CHANGE NODE'}
              </div>

              {!uploading && (
                <div style={{
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  width: '32px',
                  height: '32px',
                  background: 'var(--primary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #fff',
                  color: '#fff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
              )}
            </div>

            <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               accept="image/*" 
               style={{ display: 'none' }} 
            />

            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Click the Visual Node to update your global identity.
            </div>
          </div>

          {/* Identity Parameters */}
          <div className="glass-card" style={{ gridColumn: '1 / -1', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.8rem', color: '#0f172a' }}>Parameters</h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '0.15em' }}>✓ SYSTEM VERIFIED</span>
            </div>
            
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <div className="input-wrapper">
                  <label className="input-label">Identity Name</label>
                  <input type="text" className="input-field" name="name" value={formData.name} onChange={handleChange} required placeholder="Global Display Name" />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Email Node</label>
                  <input type="email" className="input-field" name="email" value={formData.email} disabled style={{ background: '#f8fafc', opacity: 0.6 }} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Phone Node</label>
                  <input type="tel" className="input-field" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 890" />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Temporal Node</label>
                  <input type="date" className="input-field" name="birthday" value={formData.birthday} onChange={handleChange} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Gender Property</label>
                  <select className="input-field" name="gender" value={formData.gender} onChange={handleChange} style={{ appearance: 'none' }}>
                    <option value="Male">Male Identity</option>
                    <option value="Female">Female Identity</option>
                    <option value="Other">Custom Identity</option>
                  </select>
                </div>
              </div>

              <div className="input-wrapper" style={{ marginTop: '0.5rem' }}>
                <label className="input-label">Identity Bio</label>
                <textarea className="input-field" name="bio" value={formData.bio} onChange={handleChange} style={{ height: '140px', resize: 'none' }} maxLength={250} placeholder="Tell your global story..."></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                <button type="submit" className="premium-btn" disabled={saving} style={{ padding: '1rem 3rem' }}>
                   {saving ? (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-fast 0.6s linear infinite' }}></div>
                        SYNCHRONIZING...
                     </div>
                   ) : 'SYNCHRONIZE IDENTITY'}
                </button>
                <button type="button" className="outline-btn" onClick={() => router.push('/dashboard')} style={{ padding: '1rem 3rem' }}>
                   Discard Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
