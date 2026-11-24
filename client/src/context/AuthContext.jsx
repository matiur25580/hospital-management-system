import { createContext, useContext, useState } from 'react';
import axios from 'axios';

// Centralizes the signed-in user and session token so components share one authentication state.
const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('hms_user') || 'null'); }
    catch { return null; }
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('hms_token') || '');

  const login = async (email, password) => {
    const res = await axios.post(API + '/api/auth/login', { email, password });
    const data = res.data;
    sessionStorage.setItem('hms_token', data.token);
    sessionStorage.setItem('hms_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const saveAuth = (tok, usr) => {
    sessionStorage.setItem('hms_token', tok);
    sessionStorage.setItem('hms_user', JSON.stringify(usr));
    setToken(tok);
    setUser(usr);
  };

  const logout = () => {
    sessionStorage.removeItem('hms_token');
    sessionStorage.removeItem('hms_user');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, saveAuth, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
