'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/lib/AuthContext';
import styles from './VerificationGuard.module.css';
import { softbridgeApi } from '@/lib/api';

const EXCLUDED_PATHS = ['/', '/login', '/signup', '/auth'];

export default function VerificationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, refreshProfile } = useAuth();
  const pathname = usePathname();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) {
      setVerified(user.emailVerified);
    }
  }, [user]);

  const isExcluded = EXCLUDED_PATHS.includes(pathname);

  const checkStatus = async () => {
    if (!user) return;
    setChecking(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        setVerified(true);
        // Ensure backend node exists after verification
        try {
          const profile = await softbridgeApi.getAccount(user.uid).catch(() => null);
          if (!profile) {
            await softbridgeApi.register({
              email: user.email!,
              name: user.displayName || user.email!.split('@')[0],
              password: 'PB_AUTO_SYNC_PROTECTED'
            }).catch(() => null);
          }
        } catch (syncErr) { console.warn("Ecosystem sync delayed."); }
        
        await refreshProfile();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert("Your email is not yet verified. Please check your inbox and click the verification link.");
      }
    } catch (err) {
      console.error("Verification audit failed:", err);
    } finally {
      setChecking(false);
    }
  };

  const resendEmail = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      alert("Failed to resend verification email: " + err.message);
    }
  };

  if (loading) return <>{children}</>;
  
  if (!user || verified || isExcluded) return <>{children}</>;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
         <div className={styles.icon}>🛡️</div>
         <h2 className={styles.title}>Identity Verification Required</h2>
         <p className={styles.message}>
            Your SoftBridge account is currently <b>unverified</b>. <br /> 
            Please verify your email address <span style={{ fontWeight: 800, color: '#0f172a' }}>{user.email}</span> to get full access.
         </p>
         
         <div className={styles.actionGroup}>
            <button 
              onClick={checkStatus} 
              disabled={checking} 
              className={styles.primaryBtn}
            >
              {checking ? 'CHECKING...' : 'CHECK VERIFICATION'}
            </button>
            
            <button 
              onClick={resendEmail} 
              disabled={sent} 
              className={styles.outlineBtn}
            >
              {sent ? 'LINK SENT ✅' : 'RESEND VERIFICATION EMAIL'}
            </button>
         </div>

         <div className={styles.footer}>
            <p>Access is restricted until your email is verified.</p>
         </div>
      </div>
    </div>
  );
}
