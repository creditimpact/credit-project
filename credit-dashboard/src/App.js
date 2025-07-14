import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Customers from './pages/Customers';
import WorkToday from './pages/WorkToday';
import SendLetters from './pages/SendLetters';
import Dashboard from './pages/Dashboard';
import CustomerDetails from './pages/CustomerDetails';
import Layout from './Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetails />} />
          <Route path="/work-today" element={<WorkToday />} />
          <Route path="/send-letters" element={<SendLetters />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
