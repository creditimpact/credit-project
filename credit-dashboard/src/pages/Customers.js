import * as React from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import { Link } from 'react-router-dom';
import AddCustomerDialog from '../components/AddCustomerDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { AppModeContext } from '../ModeContext';
import { AuthContext } from '../AuthContext';

const formColumns = [
  { field: 'customerName', headerName: 'Customer Name', width: 150, editable: true },
  { field: 'phone', headerName: 'Phone', width: 130, editable: true },
  { field: 'email', headerName: 'Email', width: 180, editable: true },
  { field: 'address', headerName: 'Address', width: 180, editable: true },
  { field: 'startDate', headerName: 'Start Date', width: 130, editable: true },
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
  const [newCustomer, setNewCustomer] = React.useState({ status: 'New', roundNumber: 1 });
  const [snackbar, setSnackbar] = React.useState('');
  const [uploadId, setUploadId] = React.useState(null);
  const [deleteId, setDeleteId] = React.useState(null);
  const fileInputRef = React.useRef();

  const { mode } = React.useContext(AppModeContext);
  const { token } = React.useContext(AuthContext);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
  const API_URL = `${BACKEND_URL}/api/customers`;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  React.useEffect(() => {
    if (!token) return;
    fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const mapped = data.map((c) => ({
          ...c,
          id: c.id || c._id,
          startDate: c.startDate ? c.startDate.slice(0, 10) : ''
        }));
        setRows(mapped);
      })
      .catch(err => console.error(err));
  }, [token]);

  const requiredFields = ['customerName', 'phone', 'email', 'address', 'startDate'];

  const handleProcessRowUpdate = (newRow) => {
    const missing = requiredFields.filter((f) => !newRow[f]);
    if (missing.length) {
      setSnackbar(`Missing: ${missing.join(', ')}`);
      throw new Error('validation');
    }

    const payload = { ...newRow };
    if (payload.startDate) payload.startDate = new Date(payload.startDate);
    fetch(`${API_URL}/${newRow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        const updated = { ...data, id: data.id || data._id };
        setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      });
    return newRow;
  };

  const handleAddCustomer = () => {
    const payload = { ...newCustomer };
    if (payload.startDate) payload.startDate = new Date(payload.startDate);
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        const mapped = { ...data, id: data.id || data._id };
        setRows((prev) => [...prev, mapped]);
        setOpen(false);
        setNewCustomer({ status: 'New', roundNumber: 1 });
        setSnackbar('Customer added');
      });
  };

  const handleUploadClick = (id) => {
    setUploadId(id);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !uploadId) return;

    const formData = new FormData();
    formData.append('file', file);
    fetch(`${BACKEND_URL}/api/upload/${uploadId}`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        setRows((prev) =>
          prev.map((row) =>
            row.id === uploadId ? { ...row, creditReport: data.url } : row
          )
        );
        setSnackbar('Credit report uploaded successfully ✅');
      })
      .catch(() => setSnackbar('Upload failed'))
      .finally(() => {
        e.target.value = '';
        setUploadId(null);
      });
  };

  const handleDeleteCustomer = (id) => {
    setDeleteId(id);
  };

  const confirmDeleteCustomer = () => {
    if (!deleteId) return;
    fetch(`${API_URL}/${deleteId}`, { method: "DELETE", headers: authHeaders })
      .then(res => res.json())
      .then(() => {
        setRows((prev) => prev.filter((row) => row.id !== deleteId));
        setSnackbar('Customer deleted');
      })
      .finally(() => setDeleteId(null));
  };

  const handleDeleteReport = (id) => {
    fetch(`${BACKEND_URL}/api/upload/${id}`, { method: 'DELETE', headers: authHeaders })
      .then((res) => res.json())
      .then(() => {
        setRows((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, creditReport: null } : row
          )
        );
        setSnackbar('Report deleted');
      })
      .catch(() => setSnackbar('Delete failed'));
  };

  const handleRunBot = (id) => {
    fetch(`${BACKEND_URL}/api/bot/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Mode': mode === 'real' ? 'Real' : 'Testing',
        ...authHeaders,
      },
      body: JSON.stringify({ status: 'In Progress', mode }),
    })
      .then((res) => res.json())
      .then((data) => {
        const updated = { ...data.customer, id: data.customer._id };
        setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
        setSnackbar('Bot started');
      })
      .catch(() => setSnackbar('Failed to start bot'));
  };

  const creditReportColumn = {
    field: 'creditReport',
    headerName: 'Credit Report Link',
    width: 220,
    editable: true,
    renderCell: (params) => {
      const url = params.value;
      if (!url || params.row.status === 'Needs Updated Report') {
        return (
          <span style={{ color: 'red' }}>Upload a new report to start the next round</span>
        );
      }
      const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}` + url;
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="text"
            size="small"
            component="a"
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Report
          </Button>
          <Button
            variant="text"
            color="error"
            size="small"
            onClick={() => handleDeleteReport(params.row.id)}
          >
            Delete Report
          </Button>
        </div>
      );
    },
  };

  const columns = [
    ...formColumns.map((c) => (c.field === 'creditReport' ? creditReportColumn : c)),
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 250,
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
            {params.row.status === 'Needs Updated Report' && (
              <Chip label="Upload new report" color="warning" size="small" />
            )}
            {params.row.creditReport && (
              <Chip label="Report uploaded" color="success" size="small" />
            )}
          </div>
        );
      },
      editable: true,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 320,
      renderCell: (params) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            component={Link}
            to={`/customers/${params.row.id}`}
          >
            Details
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleUploadClick(params.row.id)}
          >
            Upload Report
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleRunBot(params.row.id)}
            disabled={!params.row.creditReport}
          >
            Run Bot
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => handleDeleteCustomer(params.row.id)}
          >
            Delete
          </Button>
        </div>
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
            onProcessRowUpdateError={(err) => setSnackbar(err.message)}
            experimentalFeatures={{ newEditingApi: true }}
            slots={{ toolbar: GridToolbar }}
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
      </Paper>
      <AddCustomerDialog
        open={open}
        onClose={() => setOpen(false)}
        onAdd={handleAddCustomer}
        columns={[...formColumns, { field: 'status', headerName: 'Status' }]}
        value={newCustomer}
        setValue={setNewCustomer}
      />
      <Snackbar open={Boolean(snackbar)} onClose={() => setSnackbar('')} message={snackbar} autoHideDuration={3000} />
      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDeleteCustomer}
        title="Delete Customer"
        message="Are you sure you want to permanently delete this customer and all their data? This action cannot be undone."
      />
    </Container>
  );
}
