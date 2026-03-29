'use client';

import React from 'react';
import styles from './DeleteModal.module.css';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  showOTPStep?: boolean;
  otp?: string;
  setOtp?: (val: string) => void;
  otpError?: string;
}

export default function DeleteModal({ onConfirm, onCancel, isDeleting, showOTPStep, otp, setOtp, otpError }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.icon}>⚠️</div>
        <h2 className={styles.title}>Critical: Identity Purge</h2>
        {!showOTPStep ? (
          <p className={styles.message}>
            You are about to permanently disconnect your identity from the **SoftBridge Ecosystem**. 
            This action will terminal your profile, security nodes, and premium status.
            <br /><br />
            <span style={{ color: '#ef4444', fontWeight: 800 }}>This cannot be undone.</span>
          </p>
        ) : (
          <div className={styles.otpSection}>
             <p className={styles.message}>
                High-friction verification required. Enter the **6-digit identity node** transmitted to your email.
             </p>
             <input 
                type="text" 
                className={styles.otpInput} 
                value={otp} 
                onChange={(e) => setOtp?.(e.target.value)}
                maxLength={6}
                placeholder="000000"
                disabled={isDeleting}
             />
             {otpError && <p className={styles.error}>{otpError}</p>}
          </div>
        )}
        
        <div className={styles.actions}>
          <button 
            className={styles.deleteBtn} 
            onClick={onConfirm} 
            disabled={isDeleting}
          >
            {isDeleting ? 'PURGING NODE...' : (showOTPStep ? 'VERIFY & PURGE' : 'UNDERSTOOD, PURGE IDENTITY')}
          </button>
          
          <button 
            className={styles.cancelBtn} 
            onClick={onCancel} 
            disabled={isDeleting}
          >
            ABORT MISSION
          </button>
        </div>
      </div>
    </div>
  );
}
