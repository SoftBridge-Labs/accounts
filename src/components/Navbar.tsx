'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.name || user?.email || 'User'}&background=6366f1&color=fff&bold=true`;

  return (
    <nav className={styles.navbar}>
      <div className="container">
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo}>
            SoftBridge <span className={styles.logoAc}>Accounts</span>
          </Link>
          
          <div className={styles.links}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link href="/dashboard" className={styles.navLink} style={{ fontWeight: 800, color: '#0f172a' }}>DASHBOARD</Link>
                <Link href="/security" className={styles.navLink}>SECURITY</Link>
                <Link href="/profile" className={styles.navLink}>PROFILE</Link>
                <div style={{ width: '1px', height: '24px', background: '#e2e8f0', marginLeft: '1rem' }}></div>
                <button onClick={logout} className={styles.logoutBtn} title="Sign Out of Identity Node">
                   <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>TERMINATE SESSION</span>
                   <div className={styles.logoutDot}></div>
                </button>
                <img src={avatar} alt="Identity Sync" className={styles.avatar} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link href="/login" className={styles.navLink} style={{ color: '#0f172a', fontWeight: 800 }}>AUTHENTICATE</Link>
                <Link href="/signup" className="premium-btn" style={{ padding: '0.65rem 1.4rem', borderRadius: '10px', fontSize: '0.8rem' }}>GET IDENTITY</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
