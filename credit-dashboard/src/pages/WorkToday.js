import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import { AuthContext } from '../AuthContext';



const columns = [
  { field: 'customerName', headerName: 'Customer Name', width: 150 },
  { field: 'phone', headerName: 'Phone', width: 130 },
  { field: 'email', headerName: 'Email', width: 180 },
  { field: 'address', headerName: 'Address', width: 180 },
  { field: 'startDate', headerName: 'Start Date', width: 130 },
  { field: 'roundNumber', headerName: 'Round Number', width: 130 },
  { field: 'notes', headerName: 'Notes', width: 200 },
  {
    field: 'issueDetails',
    headerName: 'Link to Issue Details Doc',
    width: 200,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">Open</a>
    ),
  },
  {
    field: 'creditReport',
    headerName: 'Credit Report Link',
    width: 180,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">Report</a>
    ),
  },
  { field: 'smartCreditInfo', headerName: 'SmartCredit Login Info', width: 180 },
  {
    field: 'fullFile',
    headerName: 'Full Customer File (Google Doc)',
    width: 220,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">File</a>
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => <Chip label={params.value} color={params.value === 'Completed' ? 'success' : 'info'} />,
  },
];

export default function WorkToday() {
  const [rows, setRows] = React.useState([]);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
  const API_URL = `${BACKEND_URL}/api/customers/today`;
  const { token, logout } = React.useContext(AuthContext);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const checkAuth = (res) => {
    if (res.status === 401) {
      logout();
      window.location.assign('/login');
      return true;
    }
    return false;
  };

  React.useEffect(() => {
    if (!token) return;
    const fetchData = () => {
      fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (checkAuth(res)) return Promise.reject('unauthorized');
          return res.json();
        })
        .then(data => {
          const mapped = data.map((c) => ({
            ...c,
            id: c.id || c._id,
            startDate: c.startDate ? c.startDate.slice(0, 10) : ''
          }));
          setRows(mapped);
        })
        .catch(err => console.error(err));
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid rows={rows} columns={columns} pageSize={5} rowsPerPageOptions={[5]} />
        </div>
        {rows.length === 0 && <p>No customers to work on today 🎉</p>}
      </Paper>
    </Container>
  );
}
