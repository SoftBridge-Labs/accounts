'use client';

import React from 'react';
import styles from './DeleteModal.module.css';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function DeleteModal({ onConfirm, onCancel, isDeleting }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.icon}>⚠️</div>
        <h2 className={styles.title}>Critical: Identity Purge</h2>
        <p className={styles.message}>
          You are about to permanently disconnect your identity from the **SoftBridge Ecosystem**. 
          This action will terminal your profile, security nodes, and premium status.
          <br /><br />
          <span style={{ color: '#ef4444', fontWeight: 800 }}>This cannot be undone.</span>
        </p>
        
        <div className={styles.actions}>
          <button 
            className={styles.deleteBtn} 
            onClick={onConfirm} 
            disabled={isDeleting}
          >
            {isDeleting ? 'PURGING NODE...' : 'UNDERSTOOD, PURGE IDENTITY'}
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
