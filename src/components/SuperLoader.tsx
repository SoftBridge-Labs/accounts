'use client';

import React, { useEffect, useState } from 'react';
import styles from './SuperLoader.module.css';

interface SuperLoaderProps {
  message: string;
  onComplete: () => void;
}

export default function SuperLoader({ message, onComplete }: SuperLoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fake hyper-speed loader
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300); // Small delay for "wow" effect
          return 100;
        }
        // Random "fast" increments
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.glow} style={{ width: `${progress}%` }}></div>
        <div className={styles.content}>
          <div className={styles.icon}>⚡</div>
          <h2 className={styles.message}>{message}</h2>
          <div className={styles.bar}>
             <div className={styles.fill} style={{ width: `${progress}%` }}></div>
          </div>
          <p className={styles.percentage}>{progress}% Optimized</p>
        </div>
      </div>
    </div>
  );
}
