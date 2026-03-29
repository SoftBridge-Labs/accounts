'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './SuperLoader.module.css';

interface SuperLoaderProps {
  message: string;
  onComplete: () => void;
}

export default function SuperLoader({ message, onComplete }: SuperLoaderProps) {
  const [progress, setProgress] = useState(0);
  const completionTriggered = useRef(false);

  const phase = useMemo(() => {
    if (progress < 35) return 'Initializing secure tunnel';
    if (progress < 70) return 'Syncing encrypted profile';
    if (progress < 100) return 'Finalizing session';
    return 'Redirecting';
  }, [progress]);

  useEffect(() => {
    let frameId = 0;
    let completionTimer: ReturnType<typeof setTimeout> | undefined;
    const durationMs = 1700;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const normalized = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - normalized, 3);
      const next = Math.min(Math.floor(eased * 96), 96);
      setProgress(next);

      if (normalized < 1) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      setProgress(100);
      if (!completionTriggered.current) {
        completionTriggered.current = true;
        completionTimer = setTimeout(onComplete, 360);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      if (completionTimer) clearTimeout(completionTimer);
    };
  }, [onComplete]);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.halo} />
        <div className={styles.orbit} />
        <div className={`${styles.orbit} ${styles.orbitTwo}`} />
        <div className={styles.glow} style={{ width: `${progress}%` }}></div>
        <div className={styles.content}>
          <div className={styles.icon}>SB</div>
          <h2 className={styles.message}>{message}</h2>
          <p className={styles.phase}>{phase}</p>
          <div className={styles.bar}>
             <div className={styles.fill} style={{ width: `${progress}%` }}></div>
          </div>
          <div className={styles.dots} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className={styles.percentage}>{progress}% completed</p>
        </div>
      </div>
    </div>
  );
}
