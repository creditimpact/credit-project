import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Customers from './pages/Customers';
import WorkToday from './pages/WorkToday';
import SendLetters from './pages/SendLetters';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Customers />} />
        <Route path="/work-today" element={<WorkToday />} />
        <Route path="/send-letters" element={<SendLetters />} />
      </Routes>
    </Router>
  );
}

export default App;
