import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

const columns = [
  { field: 'customerName', headerName: 'Customer Name', width: 180 },
  {
    field: 'inquiryLetter',
    headerName: 'Inquiry Removal Letter',
    width: 200,
    renderCell: (params) => (
      <Button href={params.value} target="_blank" variant="outlined" size="small">Download</Button>
    ),
  },
  {
    field: 'chargeoffLetter',
    headerName: 'Charge-off Letter',
    width: 180,
    renderCell: (params) => (
      <Button href={params.value} target="_blank" variant="outlined" size="small">Download</Button>
    ),
  },
  {
    field: 'collectionLetter',
    headerName: 'Collection Letter',
    width: 180,
    renderCell: (params) => (
      <Button href={params.value} target="_blank" variant="outlined" size="small">Download</Button>
    ),
  },
  {
    field: 'goodwillLetter',
    headerName: 'Goodwill Letter',
    width: 180,
    renderCell: (params) => (
      <Button href={params.value} target="_blank" variant="outlined" size="small">Download</Button>
    ),
  },
  {
    field: 'customLetter',
    headerName: 'Custom Letter',
    width: 160,
    renderCell: (params) => (
      <Button href={params.value} target="_blank" variant="outlined" size="small">Download</Button>
    ),
  },
  {
    field: 'methodVerificationLetter',
    headerName: 'Method of Verification',
    width: 200,
    renderCell: (params) => (
      <Button href={params.value} target="_blank" variant="outlined" size="small">Download</Button>
    ),
  },
];

export default function SendLetters() {
  const rows = [
    {
      id: 1,
      customerName: 'John Doe',
      inquiryLetter: 'https://example.com/inquiry_john.pdf',
      chargeoffLetter: 'https://example.com/chargeoff_john.pdf',
      collectionLetter: 'https://example.com/collection_john.pdf',
      goodwillLetter: 'https://example.com/goodwill_john.pdf',
      customLetter: 'https://example.com/custom_john.pdf',
      methodVerificationLetter: 'https://example.com/method_john.pdf',
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      inquiryLetter: 'https://example.com/inquiry_jane.pdf',
      chargeoffLetter: 'https://example.com/chargeoff_jane.pdf',
      collectionLetter: 'https://example.com/collection_jane.pdf',
      goodwillLetter: 'https://example.com/goodwill_jane.pdf',
      customLetter: 'https://example.com/custom_jane.pdf',
      methodVerificationLetter: 'https://example.com/method_jane.pdf',
    },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid rows={rows} columns={columns} pageSize={5} rowsPerPageOptions={[5]} />
        </div>
      </Paper>
    </Container>
  );
}
