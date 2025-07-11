import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          transition: 'background-color 0.3s',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        },
      },
    },
  },
});

export default theme;
