import { Link, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';

export default function Navbar() {
  const location = useLocation();
  const links = [
    { label: 'Customers', to: '/' },
    { label: 'Work Today', to: '/work-today' },
    { label: 'Send Letters', to: '/send-letters' },
  ];

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ gap: 2 }}>
        {links.map((link) => (
          <Button
            key={link.to}
            component={Link}
            to={link.to}
            color={location.pathname === link.to ? 'secondary' : 'inherit'}
            variant={location.pathname === link.to ? 'contained' : 'text'}
          >
            {link.label}
          </Button>
        ))}
      </Toolbar>
    </AppBar>
  );
}
