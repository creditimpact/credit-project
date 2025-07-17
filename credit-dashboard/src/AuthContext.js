import React from 'react';

const AuthContext = React.createContext({
  token: null,
  login: async () => false,
  logout: () => {},
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

function decodeJwt(t) {
  try {
    return JSON.parse(atob(t.split('.')[1]));
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => localStorage.getItem('token'));

  const logout = React.useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
  }, []);

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

  React.useEffect(() => {
    if (!token) return;
    const payload = decodeJwt(token);
    if (!payload?.exp) return;
    const expiresIn = payload.exp * 1000 - Date.now();
    if (expiresIn <= 0) {
      logout();
      return;
    }
    const id = setTimeout(logout, expiresIn);
    return () => clearTimeout(id);
  }, [token, logout]);

  const value = React.useMemo(() => ({ token, login, logout }), [token, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
