'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { softbridgeApi } from '@/lib/api';
import { getBrowserMetadata } from '@/lib/utils';
import { validateOrigin } from '@/lib/ssoUtils';
import { LoginForm } from './components/LoginForm';
import { LoadingView, InvalidOriginView, NoOpenerView, AuthenticatedLoader } from './components/StatusViews';

function LoginPopupContent() {
  const { user, profile, loading } = useAuth();
  const searchParams = useSearchParams();
  const originParam = searchParams.get('origin') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [targetHost, setTargetHost] = useState('');

  const originValid = validateOrigin(originParam);

  useEffect(() => {
    if (originParam) {
      try {
        const url = new URL(originParam);
        setTargetHost(url.host);
      } catch (e) {
        setTargetHost(originParam);
      }
    }
  }, [originParam]);

  // If already authenticated and origin is valid, send data and close popup
  useEffect(() => {
    if (!loading && user && originValid) {
      if (typeof window !== 'undefined' && window.opener) {
        const sendTokenAndClose = async () => {
          try {
            const idToken = await user.getIdToken();
            const payload = {
              success: true,
              user: {
                uid: user.uid,
                email: user.email,
                name: profile?.name || user.displayName || user.email?.split('@')[0],
                premium: profile?.premium || profile?.premium_global || false,
              },
              idToken,
            };
            window.opener.postMessage(payload, originParam);
            window.close();
          } catch (err) {
            console.error("Token generation failed", err);
            setError("Failed to retrieve secure access key token.");
          }
        };
        sendTokenAndClose();
      }
    }
  }, [loading, user, originValid, profile, originParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginLoading) return;
    if (!originValid) {
      setError('Unauthorized origin. Login request rejected.');
      return;
    }

    setLoginLoading(true);
    setError('');

    try {
      const meta = await getBrowserMetadata();
      await setPersistence(auth, browserLocalPersistence).catch(() => null);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedUser = userCredential.user;
      const normalizedEmail = email.toLowerCase().trim();

      await softbridgeApi.syncLogin({ uid: loggedUser.uid, email: normalizedEmail, ip: meta.ip }).catch(() => null);
      const idToken = await loggedUser.getIdToken();
      
      let isPremium = false;
      try {
        const data = await softbridgeApi.getAccount(loggedUser.uid);
        isPremium = data?.premium || data?.user?.premium || false;
      } catch (e) {}

      const payload = {
        success: true,
        user: {
          uid: loggedUser.uid,
          email: loggedUser.email,
          name: loggedUser.displayName || loggedUser.email?.split('@')[0],
          premium: isPremium,
        },
        idToken,
      };

      if (typeof window !== 'undefined' && window.opener) {
        window.opener.postMessage(payload, originParam);
        window.close();
      } else {
        setError('Login successful, but opener window was not detected.');
      }
    } catch (err: any) {
      let customError = 'Authentication failed. Please verify your access credentials.';
      const code = err?.code || '';
      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        customError = 'Invalid email or password.';
      }
      setError(customError);
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return <LoadingView />;
  }

  if (!originValid) {
    return <InvalidOriginView />;
  }

  if (typeof window !== 'undefined' && !window.opener) {
    return <NoOpenerView />;
  }

  return (
    <div className="flex-center" style={{ minHeight: '100vh', background: '#f8fafd', padding: '1.5rem', color: 'var(--text-main)' }}>
      <div className="bg-mesh" />
      <div className="container" style={{ maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {user ? (
          <div className="glass-card" style={{ padding: '3rem 2rem', background: '#fff', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid var(--border-subtle)' }}>
            <AuthenticatedLoader name={profile?.name || user.displayName || user.email?.split('@')[0] || ''} />
          </div>
        ) : (
          <LoginForm
            onSubmit={handleLogin}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            error={error}
            loginLoading={loginLoading}
            targetHost={targetHost}
          />
        )}
      </div>
    </div>
  );
}

export default function LoginPopupPage() {
  return (
    <Suspense fallback={<LoadingView message="INITIALIZING CONNECTORS..." />}>
      <LoginPopupContent />
    </Suspense>
  );
}
