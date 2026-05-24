import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/config/providers';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const syncFromAuth = async () => {
    const { user: current, authenticated } = await auth.restoreSession();
    setUser(current);
    setIsAuthenticated(authenticated);
    setAuthChecked(true);
    setIsLoadingAuth(false);
    if (!authenticated) {
      setAuthError(null);
    }
    return current;
  };

  useEffect(() => {
    auth.logAuthDebug({ bootstrap: true });
    syncFromAuth();

    const onAuthChange = () => {
      syncFromAuth();
    };
    window.addEventListener('taxlink-auth-changed', onAuthChange);
    return () => window.removeEventListener('taxlink-auth-changed', onAuthChange);
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    await syncFromAuth();
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = async () => {
    await auth.login();
    await syncFromAuth();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings: null,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
