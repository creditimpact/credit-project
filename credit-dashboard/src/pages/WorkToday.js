import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';

const getTodayDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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
  const today = getTodayDate();

  const [rows] = React.useState([
    {
      id: 1,
      customerName: 'John Doe',
      phone: '123-456-7890',
      email: 'john@example.com',
      address: '123 Main St',
      startDate: today,
      roundNumber: 1,
      notes: 'Priority',
      issueDetails: 'https://docs.google.com/some-issue-doc',
      creditReport: 'https://example.com/report.pdf',
      smartCreditInfo: 'john_smart_login',
      fullFile: 'https://docs.google.com/some-file',
      status: 'In Progress',
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      phone: '987-654-3210',
      email: 'jane@example.com',
      address: '456 Elm St',
      startDate: '2024-06-01',
      roundNumber: 2,
      notes: '',
      issueDetails: 'https://docs.google.com/issue-doc-2',
      creditReport: 'https://example.com/report2.pdf',
      smartCreditInfo: 'jane_smart_login',
      fullFile: 'https://docs.google.com/file2',
      status: 'Pending',
    },
  ]);

  const todayRows = rows.filter((row) => row.startDate === today);

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid rows={todayRows} columns={columns} pageSize={5} rowsPerPageOptions={[5]} />
        </div>
        {todayRows.length === 0 && <p>No customers to work on today 🎉</p>}
      </Paper>
    </Container>
  );
}
