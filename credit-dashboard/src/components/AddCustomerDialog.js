import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';

export default function AddCustomerDialog({ open, onClose, onAdd, columns, value, setValue }) {
  const [error, setError] = React.useState('');

  const requiredFields = ['customerName', 'phone', 'email', 'address', 'startDate'];

  const handleAdd = () => {
    for (const field of requiredFields) {
      if (!value[field]) {
        setError(`${field} required`);
        return;
      }
    }
    onAdd();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {columns.map((col) => (
            <TextField
              key={col.field}
              margin="dense"
              label={col.headerName}
              fullWidth
              required={requiredFields.includes(col.field)}
              variant="outlined"
              type={col.field === 'startDate' ? 'date' : 'text'}
              value={col.field === 'startDate' && value[col.field] ? value[col.field].slice(0, 10) : value[col.field] || ''}
              onChange={(e) => setValue({ ...value, [col.field]: e.target.value })}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(error)} onClose={() => setError('')} message={error} autoHideDuration={3000} />
    </>
  );
}
