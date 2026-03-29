'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <nav className={styles.navbar}>
      <div className="container" style={{ maxWidth: '1440px' }}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo}>
            SoftBridge <span className={styles.logoLabs}>Accounts</span>
          </Link>
          
          <div className={`${styles.rightSection} ${menuOpen ? styles.menuOpen : ''}`}>
             <div className={styles.authSection}>
                {user ? (
                   <>
                      <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
                      <Link href="/security" className={styles.navLink}>Security</Link>
                      <Link href="/policy" className={styles.navLink}>Policy</Link>
                      <button onClick={logout} className={styles.logoutBtnPill}>
                         Sign Out
                      </button>
                   </>
                ) : (
                   <>
                      <Link href="/login" className={styles.navLink}>Sign In</Link>
                      <Link href="/signup" className="premium-btn" style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem' }}>Get Account</Link>
                   </>
                )}
             </div>
          </div>

          <button className={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>
             <div className={`${styles.hamburger} ${menuOpen ? styles.active : ''}`}></div>
          </button>
        </div>
      </div>
      {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}
    </nav>
  );
}
