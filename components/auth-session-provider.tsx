'use client';

import * as React from 'react';

type AuthSession = {
  name: string;
  email: string;
};

type AuthSessionContextValue = {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
  clearSession: () => void;
};

const STORAGE_KEY = 'smart-pig-farm-session';

const AuthSessionContext = React.createContext<AuthSessionContextValue | undefined>(undefined);

function readSessionFromStorage(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return rawValue ? (JSON.parse(rawValue) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = React.useState<AuthSession | null>(null);

  React.useEffect(() => {
    setSessionState(readSessionFromStorage());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setSessionState(readSessionFromStorage());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setSession = React.useCallback((nextSession: AuthSession | null) => {
    setSessionState(nextSession);
    if (typeof window === 'undefined') {
      return;
    }

    if (nextSession) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearSession = React.useCallback(() => {
    setSession(null);
  }, [setSession]);

  const value = React.useMemo(
    () => ({ session, setSession, clearSession }),
    [session, setSession, clearSession],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = React.useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return context;
}
