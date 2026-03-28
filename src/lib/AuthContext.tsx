'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { softbridgeApi } from './api';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
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
      } catch (err: any) {
        // Broad capture for missing or corrupted backend nodes
        const isMissing = err.message && (
            err.message.toLowerCase().includes('not found') || 
            err.message.toLowerCase().includes('server error') ||
            err.message.toLowerCase().includes('account not found')
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
          } catch (pubErr) {
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
          } catch (regErr: any) {
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshProfile]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
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
