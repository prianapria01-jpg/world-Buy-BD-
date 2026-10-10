import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';

interface AuthContextType {
  user: any | null; // Use any to allow custom user
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithPhone: (phone: string, data: any) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to read cookie by name
function getCookie(name: string): string | null {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '');
  } catch {}
  return null;
}

// Helper to set permanent persistent cookie (10 years)
function setPermanentCookie(name: string, value: string) {
  try {
    const maxAge = 10 * 365 * 24 * 60 * 60; // 10 years
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {}
}

function removeCookie(name: string) {
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(() => {
    try {
      const localUser = localStorage.getItem('phone_user');
      if (localUser) return JSON.parse(localUser);
      const cookieUser = getCookie('phone_user');
      if (cookieUser) {
        localStorage.setItem('phone_user', cookieUser);
        return JSON.parse(cookieUser);
      }
      return null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('phone_user') && !getCookie('phone_user');
    } catch {
      return true;
    }
  });

  useEffect(() => {
    // If phone user is already cached in local storage or cookie, sync is instant and permanent
    const localUser = localStorage.getItem('phone_user') || getCookie('phone_user');
    if (localUser) {
      const parsed = typeof localUser === 'string' ? JSON.parse(localUser) : localUser;
      setUser(parsed);
      localStorage.setItem('phone_user', JSON.stringify(parsed));
      setPermanentCookie('phone_user', JSON.stringify(parsed));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const existingPhoneUser = localStorage.getItem('phone_user') || getCookie('phone_user');
      if (existingPhoneUser) {
        setLoading(false);
        return;
      }
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken); // in-memory only
          // Sync user to PostgreSQL database
          await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName,
              phone: currentUser.phoneNumber,
            }),
          });
        } catch (err) {
          console.error('Failed to get token or sync user:', err);
        }
      } else {
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        const idToken = await result.user.getIdToken();
        setToken(idToken);
        await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
            phone: result.user.phoneNumber,
          }),
        });
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const loginWithPhone = (phone: string, data: any) => {
    const isNew = Boolean(data.isNewAccount);

    const customUser = {
      uid: data.uid || `phone_${phone}`,
      phoneNumber: phone,
      displayName: data.name || 'Customer',
      email: data.email || '',
      address: data.address || '',
      isPhoneUser: true,
      lastLoginAt: new Date().toISOString(),
      ...data
    };
    const userStr = JSON.stringify(customUser);
    localStorage.setItem('phone_user', userStr);
    setPermanentCookie('phone_user', userStr);
    setUser(customUser);

    if (isNew) {
      window.dispatchEvent(new CustomEvent('auth_new_user', { detail: { user: customUser } }));
    }
    window.dispatchEvent(new CustomEvent('auth_phone_login', { detail: { user: customUser } }));
  };

  const logout = async () => {
    try {
      localStorage.removeItem('phone_user');
      removeCookie('phone_user');
      localStorage.removeItem('myshop_cart');
      localStorage.removeItem('myshop_saved_cart');
      localStorage.removeItem('worldbuybd_wishlist');
      try {
        const keys = Object.keys(localStorage);
        for (const k of keys) {
          if (
            k.startsWith('customer_profile_') ||
            k.startsWith('user_cart_') ||
            k.startsWith('user_wishlist_')
          ) {
            localStorage.removeItem(k);
          }
        }
      } catch {}

      window.dispatchEvent(new CustomEvent('auth_logout'));
      await signOut(auth);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signInWithGoogle, loginWithPhone, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
