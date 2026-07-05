'use strict';

'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

interface RegisteredApp {
  client_id: string;
  client_secret: string;
  name: string;
  app_type: 'web' | 'desktop' | 'mobile';
  allowed_origins: string[];
  redirect_uris: string[];
  created_at: string;
}

export default function DeveloperPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [apps, setApps] = useState<RegisteredApp[]>([]);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New App Form State
  const [name, setName] = useState('');
  const [appType, setAppType] = useState<'web' | 'desktop' | 'mobile'>('web');
  const [originInput, setOriginInput] = useState('');
  const [redirectInput, setRedirectInput] = useState('');
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
  const [redirectUris, setRedirectUris] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Show Client Secret Modal
  const [newlyCreatedApp, setNewlyCreatedApp] = useState<RegisteredApp | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const fetchApps = async () => {
    if (!user) return;
    try {
      setFetching(true);
      const res = await softbridgeApi.apps.list(user.uid);
      if (res.success) {
        setApps(res.apps || []);
      }
    } catch (err: any) {
      console.error('Error fetching apps:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApps();
    }
  }, [user]);

  const handleAddOrigin = () => {
    if (!originInput.trim()) return;
    try {
      const url = new URL(originInput.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        setError('Origin must start with http:// or https://');
        return;
      }
      const origin = url.origin;
      if (allowedOrigins.includes(origin)) {
        setError('Origin already added');
        return;
      }
      setAllowedOrigins([...allowedOrigins, origin]);
      setOriginInput('');
      setError('');
    } catch (e) {
      setError('Invalid Origin URL format. Ex: https://myapp.com');
    }
  };

  const handleAddRedirect = () => {
    if (!redirectInput.trim()) return;
    try {
      const url = new URL(redirectInput.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        setError('Redirect URI must start with http:// or https://');
        return;
      }
      if (redirectUris.includes(url.href)) {
        setError('Redirect URI already added');
        return;
      }
      setRedirectUris([...redirectUris, url.href]);
      setRedirectInput('');
      setError('');
    } catch (e) {
      setError('Invalid Redirect URI format. Ex: https://myapp.com/callback');
    }
  };

  const handleRemoveOrigin = (index: number) => {
    setAllowedOrigins(allowedOrigins.filter((_, i) => i !== index));
  };

  const handleRemoveRedirect = (index: number) => {
    setRedirectUris(redirectUris.filter((_, i) => i !== index));
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    if (!name.trim()) {
      setError('Application Name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await softbridgeApi.apps.create({
        uid: user.uid,
        name: name.trim(),
        app_type: appType,
        allowed_origins: allowedOrigins,
        redirect_uris: redirectUris,
      });

      if (res.success) {
        setNewlyCreatedApp(res.app);
        setApps([res.app, ...apps]);
        // Reset form
        setName('');
        setAppType('web');
        setAllowedOrigins([]);
        setRedirectUris([]);
        setSuccessMsg('Application registered successfully!');
      } else {
        setError(res.message || 'Failed to create application');
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while registering application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApp = async (clientId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this application? Third-party logins using this client ID will immediately fail.')) {
      return;
    }

    try {
      const res = await softbridgeApi.apps.delete(clientId, user.uid);
      if (res.success) {
        setApps(apps.filter(app => app.client_id !== clientId));
        if (newlyCreatedApp?.client_id === clientId) {
          setNewlyCreatedApp(null);
        }
      } else {
        alert(res.message || 'Failed to delete application');
      }
    } catch (err: any) {
      alert(err?.message || 'Error occurred while deleting application');
    }
  };

  if (loading || (fetching && apps.length === 0)) {
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <div className="bg-mesh" />
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="bg-mesh" />
        <div className="container" style={{ paddingBottom: '5rem' }}>
          
          <div style={{ margin: '3rem 0 2rem 0' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Developer Console
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
              Register and manage your third-party applications to enable secure SoftBridge Accounts popup login.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
            
            {/* App Registration Form */}
            <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Register New Application
              </h2>

              <form onSubmit={handleCreateApp}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    Application Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. My Custom Calendar"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', outline: 'none', transition: 'border 0.2s' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    Application Type
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {(['web', 'desktop', 'mobile'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAppType(type)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '12px',
                          border: appType === type ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                          background: appType === type ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-subtle)',
                          color: appType === type ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          transition: 'all 0.2s'
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {appType === 'web' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                      Allowed Origins (for popup login communication)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={originInput}
                        onChange={(e) => setOriginInput(e.target.value)}
                        placeholder="e.g. http://localhost:3000"
                        style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddOrigin}
                        style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Add
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {allowedOrigins.map((origin, index) => (
                        <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#e2e8f0', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.875rem' }}>
                          {origin}
                          <button type="button" onClick={() => handleRemoveOrigin(index)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    Redirect URIs
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={redirectInput}
                      onChange={(e) => setRedirectInput(e.target.value)}
                      placeholder="e.g. https://myapp.com/auth/callback"
                      style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddRedirect}
                      style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {redirectUris.map((uri, index) => (
                      <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#e2e8f0', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.875rem' }}>
                        {uri}
                        <button type="button" onClick={() => handleRemoveRedirect(index)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {error && <div style={{ color: 'var(--error)', fontWeight: 500, marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                {successMsg && <div style={{ color: 'var(--success)', fontWeight: 500, marginBottom: '1rem', fontSize: '0.9rem' }}>{successMsg}</div>}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'var(--text-main)', color: 'white', border: 'none', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
                >
                  {submitting ? 'Creating...' : 'Register Application'}
                </button>
              </form>
            </div>

            {/* Registered Apps List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Your Applications ({apps.length})
              </h2>

              {newlyCreatedApp && (
                <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '16px', padding: '1.5rem', color: '#78350f' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>⚠️ App Created! Save your client credentials:</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div>
                      <strong>Client ID:</strong> <code style={{ background: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', wordBreak: 'break-all' }}>{newlyCreatedApp.client_id}</code>
                    </div>
                    <div>
                      <strong>Client Secret:</strong> <code style={{ background: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', wordBreak: 'break-all' }}>{newlyCreatedApp.client_secret}</code>
                    </div>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.9 }}>
                      This Client Secret will not be displayed again for security reasons. Copy it now!
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`Client ID: ${newlyCreatedApp.client_id}\nClient Secret: ${newlyCreatedApp.client_secret}`);
                        alert('Credentials copied to clipboard!');
                      }}
                      style={{ marginTop: '0.5rem', alignSelf: 'flex-start', padding: '0.5rem 1rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Copy Credentials
                    </button>
                  </div>
                </div>
              )}

              {apps.length === 0 ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No applications registered yet.</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Create one on the left to get started.</p>
                </div>
              ) : (
                apps.map((app) => (
                  <div key={app.client_id} className="glass-card" style={{ padding: '1.75rem', borderRadius: '20px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {app.name}
                      </h3>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '100px', fontWeight: 600, textTransform: 'uppercase' }}>
                        {app.app_type}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <strong>Client ID:</strong> <code style={{ background: 'var(--bg-subtle)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.85rem' }}>{app.client_id}</code>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(app.client_id);
                            alert('Client ID copied!');
                          }}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'white', cursor: 'pointer' }}
                        >
                          Copy
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <strong>Client Secret:</strong> <code style={{ background: 'var(--bg-subtle)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.85rem' }}>{app.client_secret}</code>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(app.client_secret);
                            alert('Client Secret copied!');
                          }}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'white', cursor: 'pointer' }}
                        >
                          Copy
                        </button>
                      </div>

                      {app.allowed_origins && app.allowed_origins.length > 0 && (
                        <div>
                          <strong>Allowed Origins:</strong>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                            {app.allowed_origins.map((org, i) => (
                              <code key={i} style={{ fontSize: '0.8rem', background: 'var(--bg-subtle)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{org}</code>
                            ))}
                          </div>
                        </div>
                      )}
                      {app.redirect_uris && app.redirect_uris.length > 0 && (
                        <div>
                          <strong>Redirect URIs:</strong>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                            {app.redirect_uris.map((uri, i) => (
                              <code key={i} style={{ fontSize: '0.8rem', background: 'var(--bg-subtle)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{uri}</code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                      <button
                        onClick={() => handleDeleteApp(app.client_id)}
                        style={{ border: 'none', background: 'none', color: 'var(--error)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        Delete App
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* SSO Integration Documentation */}
          <div className="glass-card" style={{ marginTop: '4rem', padding: '3rem', borderRadius: '24px', background: '#fff', gridColumn: 'span 2' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              SSO Integration Guide
            </h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Enable secure, passwordless authentication using the SoftBridge popup login flow on your website. 
              Pass both your registered <code>client_id</code> and <code>client_secret</code> to authorize and establish a secure identity session connection.
            </p>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>1. Initiate Popup Authentication</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Trigger the login popup window by passing your <code>client_id</code>, <code>client_secret</code>, and your website origin:
            </p>
            <pre style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflowX: 'auto', fontSize: '0.875rem', color: '#0f172a', marginBottom: '2rem' }}>
{`const ACCOUNTS_URL = "https://accounts.softbridgelabs.in";
const CLIENT_ID = "YOUR_CLIENT_ID"; // Obtain from registered applications list
const CLIENT_SECRET = "YOUR_CLIENT_SECRET"; // Keep secure and obtain from applications list
const origin = window.location.origin;

const popup = window.open(
  \`\${ACCOUNTS_URL}/login/popup?client_id=\${CLIENT_ID}&client_secret=\${CLIENT_SECRET}&origin=\${encodeURIComponent(origin)}\`,
  "SoftBridgeLoginPopup",
  "width=450,height=600,resizable=yes,scrollbars=yes"
);`}
            </pre>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>2. Listen for Authentication Payload</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Add a message event listener to receive the user's profile and secure credentials:
            </p>
            <pre style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflowX: 'auto', fontSize: '0.875rem', color: '#0f172a', marginBottom: '2rem' }}>
{`window.addEventListener("message", (event) => {
  if (event.origin !== ACCOUNTS_URL) return;

  const authData = event.data;
  if (authData && authData.success) {
    console.log("Authenticated User:", authData.user);
    console.log("Firebase ID Token:", authData.idToken);
    
    // Proceed with user login/session registration
  }
});`}
            </pre>
          </div>

        </div>
      </div>
    </>
  );
}
