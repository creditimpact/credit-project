import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';

const columns = [
  { field: 'customerName', headerName: 'Customer Name', width: 180 },
  {
    field: 'inquiryLetter',
    headerName: 'Inquiry Removal Letter',
    width: 200,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">
        Download
      </a>
    ),
  },
  {
    field: 'chargeoffLetter',
    headerName: 'Charge-off Letter',
    width: 180,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">
        Download
      </a>
    ),
  },
  {
    field: 'collectionLetter',
    headerName: 'Collection Letter',
    width: 180,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">
        Download
      </a>
    ),
  },
  {
    field: 'goodwillLetter',
    headerName: 'Goodwill Letter',
    width: 180,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">
        Download
      </a>
    ),
  },
  {
    field: 'customLetter',
    headerName: 'Custom Letter',
    width: 160,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">
        Download
      </a>
    ),
  },
  {
    field: 'methodVerificationLetter',
    headerName: 'Method of Verification',
    width: 200,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">
        Download
      </a>
    ),
  },
];

export default function SendLetters() {
  // דמו — בהמשך זה יגיע מהבוט
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
    <div style={{ height: 600, width: '100%', marginTop: 20 }}>
      <h1>Send Letters Today</h1>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
      />
    </div>
  );
}
