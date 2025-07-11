import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import AddCustomerDialog from '../components/AddCustomerDialog';

const columnsBase = [
  { field: 'customerName', headerName: 'Customer Name', width: 150, editable: true },
  { field: 'phone', headerName: 'Phone', width: 130, editable: true },
  { field: 'email', headerName: 'Email', width: 180, editable: true },
  { field: 'address', headerName: 'Address', width: 180, editable: true },
  { field: 'startDate', headerName: 'Start Date', width: 130, editable: true },
  { field: 'roundNumber', headerName: 'Round Number', width: 130, editable: true },
  { field: 'notes', headerName: 'Notes', width: 200, editable: true },
  {
    field: 'issueDetails',
    headerName: 'Link to Issue Details Doc',
    width: 200,
    editable: true,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">Open</a>
    ),
  },
  {
    field: 'creditReport',
    headerName: 'Credit Report Link',
    width: 180,
    editable: true,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">Report</a>
    ),
  },
  { field: 'smartCreditInfo', headerName: 'SmartCredit Login Info', width: 180, editable: true },
  {
    field: 'fullFile',
    headerName: 'Full Customer File (Google Doc)',
    width: 220,
    editable: true,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">File</a>
    ),
  },
];

export default function Customers() {
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState({ status: 'New' });

  const API_URL = "http://localhost:5000/api/customers";

  React.useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setRows(data))
      .catch(err => console.error(err));
  }, []);

  const handleProcessRowUpdate = (newRow) => {
    fetch(`${API_URL}/${newRow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRow),
    })
      .then(res => res.json())
      .then(() => {
        setRows((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
      });
    return newRow;
  };

  const handleAddCustomer = () => {
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    })
      .then(res => res.json())
      .then(data => {
        setRows((prev) => [...prev, data]);
        setOpen(false);
        setNewCustomer({ status: 'New' });
      });
  };

  const handleDeleteCustomer = (id) => {
    fetch(`${API_URL}/${id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => {
        setRows((prev) => prev.filter((row) => row.id !== id));
      });
  };

  const columns = [
    ...columnsBase,
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <Chip label={params.value} color={params.value === 'Completed' ? 'success' : 'info'} />,
      editable: true,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => handleDeleteCustomer(params.row.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Button variant="contained" sx={{ mb: 2 }} onClick={() => setOpen(true)}>
          Add Customer
        </Button>
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            processRowUpdate={handleProcessRowUpdate}
            experimentalFeatures={{ newEditingApi: true }}
          />
        </div>
      </Paper>
      <AddCustomerDialog
        open={open}
        onClose={() => setOpen(false)}
        onAdd={handleAddCustomer}
        columns={[...columnsBase, { field: 'status', headerName: 'Status' }]}
        value={newCustomer}
        setValue={setNewCustomer}
      />
    </Container>
  );
}
