import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

const BACKEND_URL = 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api/customers/letters-ready`;

const columns = [
  { field: 'customerName', headerName: 'Customer Name', width: 180 },
  {
    field: 'letters',
    headerName: 'Letters',
    flex: 1,
    minWidth: 300,
    renderCell: (params) => (
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, overflowX: 'visible' }}
      >
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
  {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    minWidth: 220,
    renderCell: (params) => {
      const color =
        params.row.status === 'Completed'
          ? 'success'
          : params.row.status === 'Needs Updated Report'
          ? 'warning'
          : 'info';
      return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip label={`Round ${params.row.roundNumber || 1}`} size="small" />
          <Chip label={params.row.status} color={color} size="small" />
        </div>
      );
    },
  },
  {
    field: 'actions',
    headerName: 'Actions',
    flex: 1,
    minWidth: 150,
    renderCell: (params) => (
      <Button
        variant="outlined"
        size="small"
        onClick={() => params.row.onMark()}
      >
        Mark Completed
      </Button>
    ),
  },
];

export default function SendLetters() {
  const [rows, setRows] = React.useState([]);

  const markCompleted = (id) => {
    fetch(`${BACKEND_URL}/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Completed' }),
    })
      .then((res) => res.json())
      .then(() => {
        setRows((prev) => prev.filter((r) => r.id !== id));
      })
      .catch((err) => console.error(err));
  };

  React.useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((c) => ({
          ...c,
          id: c.id || c._id,
          onMark: () => markCompleted(c.id || c._id),
        }));
        setRows(mapped);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              autoHeight
              getRowHeight={() => 'auto'}
              sx={{
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal',
                  lineHeight: 1.4,
                },
                '& .MuiDataGrid-row': {
                  maxHeight: 'none !important',
                  alignItems: 'start',
                },
              }}
            />
          </div>
        {rows.length === 0 && <p>No letters ready to send.</p>}
      </Paper>
    </Container>
  );
}
