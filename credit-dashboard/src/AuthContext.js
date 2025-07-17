import React from 'react';

const AuthContext = React.createContext({ token: null, login: async () => false });

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => localStorage.getItem('token'));

  const login = async (username, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('token', data.token);
      setToken(data.token);
      return true;
    } catch {
      return false;
    }
  };

  const value = React.useMemo(() => ({ token, login }), [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
