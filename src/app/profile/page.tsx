'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import GlassNotification from '@/components/GlassNotification';
import { handleProfilePhotoChange } from '@/app/actions/imageUpload';
import { getBrowserMetadata, formatPrettyDate, parsePrettyDate } from '@/lib/utils';
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
  const [originalData, setOriginalData] = useState<any>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [rotating, setRotating] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      const initial = {
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        avatar_url: p.avatar_url || '',
        birthday: p.birthday ? new Date(p.birthday).toISOString().split('T')[0] : '',
        gender: p.gender || 'Other',
        bio: p.bio || ''
      };
      setFormData(initial);
      setOriginalData(initial);
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh' }}>
       <div className="bg-mesh" />
       <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
    </div>
  );
  
  if (!user) return null;

  const isProfileSyncing = !profile && !loading;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateSelect = (date: string) => {
    setFormData({ ...formData, birthday: date });
    setShowDatePicker(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setNotification(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
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

  const confirmRotation = async () => {
    const error = checkRateLimit('rotation');
    if (error) {
      setNotification({ message: error, type: 'error' });
      setShowRotationModal(false);
      return;
    }

    setRotating(true);
    try {
      await softbridgeApi.forgotPassword(user.email!);
      setNotification({ message: 'Password reset link transmitted to identity email.', type: 'success' });
    } catch (e) {
      setNotification({ message: 'Failed to trigger password rotation.', type: 'error' });
    } finally {
      setRotating(false);
      setShowRotationModal(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = checkRateLimit('update');
    if (error) {
      setNotification({ message: error, type: 'error' });
      return;
    }

    setSaving(true);
    setNotification(null);

    try {
      const payload: any = { ...formData, uid: user.uid };
      if (!payload.birthday) delete payload.birthday; 
      
      await softbridgeApi.updateAccountFull(payload);
      
      const changes: string[] = [];
      if (formData.name !== originalData?.name) changes.push(`Name changed to: ${formData.name}`);
      if (formData.phone !== originalData?.phone) changes.push(`Phone changed to: ${formData.phone || 'Cleared'}`);
      if (formData.birthday !== originalData?.birthday) changes.push(`DOB changed to: ${formatPrettyDate(formData.birthday) || 'Cleared'}`);
      if (formData.bio !== originalData?.bio) changes.push(`Bio updated`);
      if (formData.gender !== originalData?.gender) changes.push(`Gender set to: ${formData.gender}`);

      const meta = await getBrowserMetadata();
      const changeLog = changes.length > 0 ? changes.join('\n- ') : 'No data parameters modified.';

      // Log activity to SoftBridge Audit Nodes
      try {
        await softbridgeApi.addActivity({ 
          uid: user.uid, 
          action: 'identity_synchronized'
        }).catch(() => null);
        
        await softbridgeApi.createAuditLog({
          uid: user.uid,
          event: 'profile_updated',
          source: 'softbridge',
          details: { changes: changes.length }
        }).catch(() => null);
      } catch (e) {}

      try {
        await softbridgeApi.sendAlert({
          email: user.email!,
          type: 'identity_synchronized',
          details: `Parameters updated for ${formData.name}. \n\nCHANGES:\n- ${changeLog}\n\nAUTH NODE METADATA:\nIP: ${meta.ip}\nACCESS DEVICE: ${meta.device}\nLOCATION: ${meta.location || 'Distributed Node'}\nUA: ${meta.ua}`
        }).catch(() => null);
      } catch (e) {}

      await refreshProfile();
      setNotification({ message: 'Identity synchronized successfully.', type: 'success' });
      setOriginalData(formData);
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

      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <header className="animate-in" style={{ marginBottom: '4.5rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em' }}>Manage <span className="accent-gradient">Identity</span></h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', fontWeight: 500, marginTop: '0.4rem' }}>Global preferences for the SoftBridge identity nodes.</p>
        </header>

        <div className="grid-responsive animate-in stagger-1" style={{ gap: '3.5rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div className={`glass-card ${isProfileSyncing ? 'shimmer shimmer-card' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', textAlign: 'center', background: '#fff', padding: '3rem' }}>
              {isProfileSyncing ? (
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                    <div className="shimmer shimmer-avatar"></div>
                    <div className="shimmer shimmer-text" style={{ width: '60%' }}></div>
                 </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: 800 }}>Visual Node</h3>
                  
                  <div 
                    style={{ 
                      position: 'relative', 
                      width: '160px', 
                      height: '160px', 
                      margin: '0 auto',
                      cursor: 'pointer',
                      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    onClick={triggerUpload}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ position: 'absolute', inset: '-10px', border: '2px dashed var(--primary)', borderRadius: '50%', opacity: 0.15 }}></div>
                    <img 
                      src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.name || user.email}&background=4f46e5&color=fff&bold=true`} 
                      alt="Avatar" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        borderRadius: '50%', 
                        objectFit: 'cover', 
                        border: '6px solid #fff', 
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                        filter: uploading ? 'blur(4px)' : 'none'
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
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}>
                      {uploading ? 'SYNCING...' : 'CHANGE NODE'}
                    </div>

                    {!uploading && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '36px',
                        height: '36px',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '4px solid #fff',
                        color: '#fff',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                    )}
                  </div>

                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>Click to update Visual Identity.</p>
                </>
              )}
            </div>

            <div className={`glass-card ${isProfileSyncing ? 'shimmer shimmer-card' : ''}`} style={{ background: '#fff', padding: '2.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#0f172a', fontWeight: 800, marginBottom: '1.5rem' }}>Identity Bio</h3>
              {isProfileSyncing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div className="shimmer shimmer-text"></div>
                  <div className="shimmer shimmer-text" style={{ width: '80%' }}></div>
                  <div className="shimmer shimmer-text" style={{ width: '90%' }}></div>
                </div>
              ) : (
                <textarea 
                  className="input-field" 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleChange} 
                  style={{ height: '160px', resize: 'none', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }} 
                  maxLength={250} 
                  placeholder="Share your ecosystem profile details..." 
                />
              )}
            </div>
          </div>

          <div className="glass-card" style={{ background: '#fff', padding: '3.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '2rem', color: '#0f172a', fontWeight: 800 }}>Parameters</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginTop: '0.3rem', fontWeight: 500 }}>Global identity duration and status nodes.</p>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '0.15em', background: 'rgba(16, 185, 129, 0.08)', padding: '0.5rem 1rem', borderRadius: '100px' }}>✓ SYSTEM VERIFIED</span>
            </div>
            
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
                <div className="input-wrapper">
                  <label className="input-label">Identity Name</label>
                  {isProfileSyncing ? <div className="shimmer shimmer-text" style={{ height: '3.5rem' }}></div> : 
                  <input type="text" className="input-field" name="name" value={formData.name} onChange={handleChange} required placeholder="Global Display Name" />}
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Email Node</label>
                  <input type="email" className="input-field" name="email" value={formData.email} disabled style={{ background: '#f8fafc', opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Phone Node</label>
                  {isProfileSyncing ? <div className="shimmer shimmer-text" style={{ height: '3.5rem' }}></div> : 
                  <input type="tel" className="input-field" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 890" />}
                </div>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <label className="input-label">Temporal Node (DOB)</label>
                  {isProfileSyncing ? <div className="shimmer shimmer-text" style={{ height: '3.5rem' }}></div> : 
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formatPrettyDate(formData.birthday)} 
                      onClick={() => setShowDatePicker(true)}
                      readOnly
                      placeholder="dd/mm/yyyy" 
                      style={{ cursor: 'pointer' }}
                    />
                    {showDatePicker && (
                      <div ref={datePickerRef} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, marginTop: '10px', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.15)', width: '320px' }}>
                        <p style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '0.9rem' }}>Select Temporal Node</p>
                        <input 
                          type="date" 
                          className="input-field" 
                          style={{ padding: '0.8rem' }}
                          onChange={(e) => handleDateSelect(e.target.value)}
                        />
                      </div>
                    )}
                  </div>}
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Gender Property</label>
                  {isProfileSyncing ? <div className="shimmer shimmer-text" style={{ height: '3.5rem' }}></div> : 
                  <select className="input-field" name="gender" value={formData.gender} onChange={handleChange} style={{ appearance: 'none' }}>
                    <option value="Male">Male Identity</option>
                    <option value="Female">Female Identity</option>
                    <option value="Other">Custom Identity</option>
                  </select>}
                </div>
                <div className="input-wrapper" style={{ visibility: 'hidden' }}></div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="submit" className="premium-btn" disabled={saving || isProfileSyncing} style={{ padding: '1.2rem 4rem', fontSize: '1rem' }}>
                   {saving ? 'SYNCHRONIZING...' : 'SYNCHRONIZE IDENTITY'}
                </button>
                <div style={{ flex: 1 }}></div>
                <button 
                  type="button" 
                  className="outline-btn" 
                  onClick={() => setShowRotationModal(true)} 
                  disabled={isProfileSyncing}
                  style={{ border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', padding: '0.5rem' }}
                >
                  ROTATE ACCESS KEY
                </button>
                <button type="button" className="outline-btn" onClick={() => router.push('/dashboard')} style={{ padding: '1.2rem 3rem', fontSize: '1rem' }}>
                   Back
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
