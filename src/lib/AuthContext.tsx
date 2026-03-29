'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { softbridgeApi } from './api';

export interface UserProfile {
  uid?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  premium?: boolean;
  premium_global?: boolean;
  premiumUntil?: string | number | Date;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        // Backend returns: { success: true, premium, user: { ... } }
        const data = await softbridgeApi.getAccount(uid);
        if (data && data.user) {
           setProfile({ ...data.user, premium_global: data.premium });
        } else {
           setProfile(data);
        }
      } catch (err: unknown) {
        // Broad capture for missing or corrupted backend nodes
        const message = err instanceof Error ? err.message.toLowerCase() : '';
        const isMissing = message && (
            message.includes('not found') || 
            message.includes('server error') ||
            message.includes('account not found')
        );

        if (isMissing) {
          console.warn("Ecosystem Node Synchronization Triggered.");
          try {
             // 1. Double-probe via discovery node: { success: true, user: { ... } }
             const pubData = await softbridgeApi.getPublicProfile(uid).catch(() => null);
             if (pubData && pubData.user) {
                setProfile(pubData.user);
                return;
             }
           } catch {
             console.warn("Direct identity node retrieval failed.");
          }

          try {
            // 2. Initializing Identity Node
            const initData = await softbridgeApi.updateAccountFull({
              uid,
              email: auth.currentUser.email!,
              name: auth.currentUser.displayName || auth.currentUser.email!.split('@')[0]
              // Omit birthday to avoid SQL parsing error on empty string
            });
            
            // 3. Final state audit
            if (initData && initData.user) {
               setProfile(initData.user);
            } else {
               const finalData = await softbridgeApi.getAccount(uid);
               setProfile(finalData.user || finalData);
            }
          } catch {
            console.error("Identity Node synchronization stalled.");
          }
        } else {
          console.error("Identity Hub accessibility failure.");
        }
      }
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const bootSafetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Unblock UI as soon as auth state is known; profile can hydrate in background.
      setLoading(false);

      if (firebaseUser) {
        void refreshProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      clearTimeout(bootSafetyTimer);
      unsubscribe();
    };
  }, [refreshProfile]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    window.location.href = 'https://softbridgelabs.in';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
