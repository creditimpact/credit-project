import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

const BACKEND_URL = 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api/customers/letters-ready`;

const columns = [
  { field: 'customerName', headerName: 'Customer Name', width: 180 },
  {
    field: 'letters',
    headerName: 'Letters',
    flex: 1,
    renderCell: (params) => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {params.value.map((l, i) => {
          const fullUrl = l.url.startsWith('http')
            ? l.url
            : `${BACKEND_URL}${l.url.startsWith('/') ? '' : '/'}${l.url}`;
          return (
            <Button key={i} href={fullUrl} target="_blank" variant="outlined" size="small">
              {l.name || `Letter ${i + 1}`}
            </Button>
          );
        })}
      </div>
    ),
  },
  { field: 'status', headerName: 'Status', width: 150 },
];

export default function SendLetters() {
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((c) => ({ ...c, id: c.id || c._id }));
        setRows(mapped);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid rows={rows} columns={columns} pageSize={5} rowsPerPageOptions={[5]} />
        </div>
        {rows.length === 0 && <p>No letters ready to send.</p>}
      </Paper>
    </Container>
  );
}
