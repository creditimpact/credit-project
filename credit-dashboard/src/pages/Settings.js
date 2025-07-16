import React from 'react';
import { Typography, Button, Stack, Chip } from '@mui/material';
import { AppModeContext } from '../ModeContext';

export default function Settings() {
  const { mode, setMode } = React.useContext(AppModeContext);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Settings</Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography>Current Mode:</Typography>
        <Chip
          label={mode === 'testing' ? 'Testing Mode' : 'Real Mode'}
          color={mode === 'testing' ? 'warning' : 'success'}
          size="small"
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <Button
          variant={mode === 'testing' ? 'contained' : 'outlined'}
          onClick={() => setMode('testing')}
        >
          Testing Mode
        </Button>
        <Button
          variant={mode === 'real' ? 'contained' : 'outlined'}
          onClick={() => setMode('real')}
        >
          Real Mode
        </Button>
      </Stack>
    </Stack>
  );
}
