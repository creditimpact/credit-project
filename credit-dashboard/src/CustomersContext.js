import React from 'react';
import { AuthContext } from './AuthContext';

const CustomersContext = React.createContext({
  customers: [],
  setCustomers: () => {},
  refreshCustomers: () => {},
});

export default function CustomersProvider({ children }) {
  const { token } = React.useContext(AuthContext);
  const [customers, setCustomers] = React.useState([]);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
  const API_URL = `${BACKEND_URL}/api/customers`;

  const refreshCustomers = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const mapped = data.map((c) => ({
        ...c,
        id: c.id || c._id,
        startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      }));
      setCustomers(mapped);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

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
