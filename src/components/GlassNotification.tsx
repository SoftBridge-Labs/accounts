'use client';

import React, { useEffect, useState } from 'react';
import styles from './GlassNotification.module.css';

interface Props {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function GlassNotification({ message, type, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.icon}>{type === 'success' ? '✅' : '⚠️'}</div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
      <div className={styles.progress}></div>
    </div>
  );
}
