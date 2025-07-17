import React from 'react';
import { AuthContext } from './AuthContext';

const CustomersContext = React.createContext({
  customers: [],
  setCustomers: () => {},
  refreshCustomers: () => {},
});

export default function CustomersProvider({ children }) {
  const { token, logout } = React.useContext(AuthContext);
  const [customers, setCustomers] = React.useState([]);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
  const API_URL = `${BACKEND_URL}/api/customers`;

  const refreshCustomers = React.useCallback(async () => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        logout();
        window.location.assign('/login');
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error('Expected array but got:', data);
        return;
      }
      const mapped = data.map((c) => ({
        ...c,
        id: c.id || c._id,
        startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      }));
      setCustomers(mapped);
    } catch (err) {
      console.error(err);
    }
  }, [token, logout]);

  React.useEffect(() => {
    if (token) {
      refreshCustomers();
    }
  }, [token, refreshCustomers]);

  const value = React.useMemo(
    () => ({ customers, setCustomers, refreshCustomers }),
    [customers, refreshCustomers]
  );

  return (
    <CustomersContext.Provider value={value}>
      {children}
    </CustomersContext.Provider>
  );
}

export { CustomersContext };
