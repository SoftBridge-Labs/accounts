import React from 'react';

export const LoadingView: React.FC<{ message?: string }> = ({ message = 'VERIFYING SESSION SECURELY...' }) => {
  return (
    <div className="flex-center" style={{ height: '100vh', background: '#f8fafd' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite' }}></div>
      <p style={{ marginTop: '1.2rem', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.9rem' }}>{message}</p>
    </div>
  );
};

export const InvalidOriginView: React.FC = () => {
  return (
    <div className="flex-center" style={{ height: '100vh', background: '#f8fafd', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🚫</div>
      <h3 style={{ color: 'var(--error)', fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.5rem' }}>Access Restricted</h3>
      <p style={{ color: 'var(--text-dim)', maxWidth: '400px', fontSize: '0.9rem', lineHeight: '1.6' }}>
        This authentication gateway can only be accessed by authorized SoftBridge applications (localhost or *.softbridgelabs.in).
      </p>
    </div>
  );
};

export const NoOpenerView: React.FC = () => {
  return (
    <div className="flex-center" style={{ height: '100vh', background: '#f8fafd', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🔌</div>
      <h3 style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.5rem' }}>No Connection</h3>
      <p style={{ color: 'var(--text-dim)', maxWidth: '400px', fontSize: '0.9rem', lineHeight: '1.6' }}>
        This page must be opened as a popup by a parent SoftBridge application to establish a secure session connection.
      </p>
    </div>
  );
};

interface AuthenticatedViewProps {
  name: string;
}

export const AuthenticatedLoader: React.FC<AuthenticatedViewProps> = ({ name }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin-fast 0.8s linear infinite', margin: '0 auto 1.5rem' }}></div>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
        Signed in as <strong>{name}</strong>. Returning you to the application...
      </p>
    </div>
  );
};
