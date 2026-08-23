import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { loadApiBaseUrl } from '../api/serverUrl';

export const AuthContext = createContext(null);

// status: 'checking' | 'authenticated' | 'unauthenticated'
export function AuthProvider({ children }) {
  const [status, setStatus] = useState('checking');
  const [user, setUser] = useState(null);

  const checkSession = useCallback(async () => {
    try {
      const profile = await authApi.fetchProfile({ skipAuthRedirect: true });
      setUser(profile);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    // Must load any saved server URL before the first request fires, or the
    // boot session check would hit the hardcoded default instead.
    loadApiBaseUrl().then(checkSession);
  }, [checkSession]);

  useEffect(() => {
    // Any request anywhere in the app that gets a 401 mid-session lands here,
    // not just the boot check — forces the user back to the login screen.
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (username, password) => {
    await authApi.login(username, password);
    const profile = await authApi.fetchProfile({ skipAuthRedirect: true });
    setUser(profile);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort: still clear local session state even if the network
      // call itself fails outright (server unreachable, no connection —
      // notably right after pointing Settings at a different server URL).
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo(
    () => ({ status, user, login, logout, refreshProfile: checkSession }),
    [status, user, login, logout, checkSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
