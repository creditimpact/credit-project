import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Customers from './pages/Customers';
import WorkToday from './pages/WorkToday';
import SendLetters from './pages/SendLetters';
import Dashboard from './pages/Dashboard';
import CustomerDetails from './pages/CustomerDetails';
import Settings from './pages/Settings';
import Layout from './Layout';
import Login from './pages/Login';
import AuthProvider from './AuthContext';
import RequireAuth from './RequireAuth';
import CustomersProvider from './CustomersContext';

function PrivateRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />
        <Route path="/work-today" element={<WorkToday />} />
        <Route path="/send-letters" element={<SendLetters />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <CustomersProvider>
                  <PrivateRoutes />
                </CustomersProvider>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
