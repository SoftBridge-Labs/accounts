'use client';

import React from 'react';
import styles from './DeleteModal.module.css'; // Reusing styles

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  title: string;
  message: string;
  confirmText: string;
}

export default function SecurityModal({ onConfirm, onCancel, isLoading, title, message, confirmText }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.icon}>🛡️</div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>
          {message}
        </p>
        
        <div className={styles.actions}>
          <button 
            className="premium-btn" 
            style={{ padding: '0.8rem 1.5rem', flex: 1, fontSize: '0.85rem' }}
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? 'SYNCING...' : confirmText}
          </button>
          
          <button 
            className="outline-btn" 
            style={{ padding: '0.8rem 1.5rem', flex: 1, fontSize: '0.85rem' }}
            onClick={onCancel} 
            disabled={isLoading}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
