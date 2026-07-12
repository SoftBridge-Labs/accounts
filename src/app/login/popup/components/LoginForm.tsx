import React from 'react';

interface LoginFormProps {
  onSubmit: (e: React.FormEvent) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  error: string;
  loginLoading: boolean;
  targetHost: string;
  accountNotFound?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  email,
  setEmail,
  password,
  setPassword,
  error,
  loginLoading,
  targetHost,
  accountNotFound,
}) => {
  return (
    <div className="glass-card" style={{ padding: '3rem 2rem', background: '#fff', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid var(--border-subtle)' }}>
      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 950, fontSize: '0.8rem' }}>S</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>SoftBridge</span>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Sign In to Continue</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
          Authorize access for <strong style={{ color: 'var(--primary)' }}>{targetHost}</strong>
        </p>
      </header>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="input-label" style={{ marginBottom: '0.45rem', fontSize: '0.8rem' }}>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            autoComplete="email"
            placeholder="name@company.com"
            className="input-field"
            style={{ borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.9rem' }}
          />
        </div>
        
        <div style={{ marginBottom: '1.75rem' }}>
          <label className="input-label" style={{ marginBottom: '0.45rem', fontSize: '0.8rem' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            autoComplete="current-password"
            placeholder="••••••••"
            className="input-field"
            style={{ borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.9rem' }}
          />
        </div>

        {error && (
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', color: '#f87171', fontSize: '0.8rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}>
             <span>⚠️</span> {error}
          </div>
        )}

        <button type="submit" disabled={loginLoading} className="premium-btn" style={{ width: '100%', borderRadius: '12px', padding: '0.9rem', fontSize: '0.9rem', fontWeight: 700 }}>
          {loginLoading ? 'Authenticating...' : 'Authorize Login'}
        </button>

        {accountNotFound && (
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Don't have an account?</p>
            <button 
              type="button" 
              onClick={() => window.open('/signup', '_blank')}
              style={{ 
                width: '100%', 
                borderRadius: '12px', 
                padding: '0.9rem', 
                fontSize: '0.9rem', 
                fontWeight: 700,
                background: 'transparent',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                cursor: 'pointer'
              }}
            >
              Create New Account
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
