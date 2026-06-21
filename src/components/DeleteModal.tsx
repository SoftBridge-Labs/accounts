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
        <h2 className={styles.title}>Delete Identity Node</h2>
        {!showOTPStep ? (
          <p className={styles.message}>
            You are about to permanently remove your identity from the <strong>SoftBridge Ecosystem</strong>. 
            This will delete your profile parameters, deactivate active integrations, and clear all security settings.
            <br /><br />
            <span style={{ color: '#fa5252', fontWeight: 600 }}>This action cannot be undone.</span>
          </p>
        ) : (
          <div className={styles.otpSection}>
             <p className={styles.message}>
                For security, please enter the <strong>6-digit verification code</strong> sent to your registered email.
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
            {isDeleting ? 'Deactivating Node...' : (showOTPStep ? 'Confirm Deletion' : 'Delete Identity')}
          </button>
          
          <button 
            className={styles.cancelBtn} 
            onClick={onCancel} 
            disabled={isDeleting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
