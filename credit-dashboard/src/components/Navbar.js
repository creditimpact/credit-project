import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';

export default function Navbar() {
  return (
    <div style={{ padding: 10 }}>
      <Button component={Link} to="/">Customers</Button>
      <Button component={Link} to="/work-today">Work Today</Button>
      <Button component={Link} to="/send-letters">Send Letters</Button>
    </div>
  );
}
