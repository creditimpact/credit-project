import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';

// פונקציה שמחזירה את התאריך של היום בפורמט YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// רשימת עמודות זהה ל-Customers אבל בלי כפתור Delete
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
      <a href={params.value} target="_blank" rel="noopener noreferrer">
        Open
      </a>
    ),
  },
  {
    field: 'creditReport',
    headerName: 'Credit Report Link',
    width: 180,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">
        Report
      </a>
    ),
  },
  { field: 'smartCreditInfo', headerName: 'SmartCredit Login Info', width: 180 },
  {
    field: 'fullFile',
    headerName: 'Full Customer File (Google Doc)',
    width: 220,
    renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">
        File
      </a>
    ),
  },
];

export default function WorkToday() {
  const today = getTodayDate();

  // ⚡ כאן מדמים רשימת לקוחות — בשלב הבא אפשר לשתף מ-CRM או לשמור ב-DB
  const [rows, setRows] = React.useState([
    {
      id: 1,
      customerName: 'John Doe',
      phone: '123-456-7890',
      email: 'john@example.com',
      address: '123 Main St',
      startDate: today, // היום
      roundNumber: 1,
      notes: 'Priority',
      issueDetails: 'https://docs.google.com/some-issue-doc',
      creditReport: 'https://example.com/report.pdf',
      smartCreditInfo: 'john_smart_login',
      fullFile: 'https://docs.google.com/some-file',
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      phone: '987-654-3210',
      email: 'jane@example.com',
      address: '456 Elm St',
      startDate: '2024-06-01', // תאריך אחר
      roundNumber: 2,
      notes: '',
      issueDetails: 'https://docs.google.com/issue-doc-2',
      creditReport: 'https://example.com/report2.pdf',
      smartCreditInfo: 'jane_smart_login',
      fullFile: 'https://docs.google.com/file2',
    },
  ]);

  // סינון לפי Start Date == היום
  const todayRows = rows.filter((row) => row.startDate === today);

  return (
    <div style={{ height: 600, width: '100%', marginTop: 20 }}>
      <h1>Work Today - {today}</h1>

      <DataGrid
        rows={todayRows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
      />

      {todayRows.length === 0 && (
        <p>No customers to work on today 🎉</p>
      )}
    </div>
  );
}
