import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { supabase } from "../utils/supabase";

const AuthContext = createContext(null);

const TOKEN_KEY = "secure_auth_token";
const USER_KEY = "secure_auth_user";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [mfaPendingCredentials, setMfaPendingCredentials] = useState(null);

  const storeAuth = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const hydrateCurrentUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authService.me();
      setUser(response.user);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (error) {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateCurrentUser();
  }, []);

  const signup = async (payload) => authService.signup(payload);

  const login = async ({ email, password, otp }) => {
    const response = await authService.login({ email, password, otp });
    if (response.mfaRequired) {
      setMfaPendingCredentials({ email, password });
      return { mfaRequired: true };
    }

    if (response.supabaseSession?.access_token && response.supabaseSession?.refresh_token) {
      await supabase.auth.setSession({
        access_token: response.supabaseSession.access_token,
        refresh_token: response.supabaseSession.refresh_token
      });
    }

    storeAuth(response.token, response.user);
    setMfaPendingCredentials(null);
    return { mfaRequired: false, user: response.user };
  };

  const completeMfaLogin = async (otp) => {
    if (!mfaPendingCredentials) {
      throw new Error("MFA session expired. Please re-enter your credentials.");
    }

    return login({
      ...mfaPendingCredentials,
      otp
    });
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } finally {
      clearAuth();
      setMfaPendingCredentials(null);
    }
  };

  const refreshUser = async () => {
    const response = await authService.me();
    setUser(response.user);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response.user;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      signup,
      login,
      logout,
      refreshUser,
      mfaPending: Boolean(mfaPendingCredentials),
      completeMfaLogin
    }),
    [token, user, loading, mfaPendingCredentials]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
