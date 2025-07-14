import React from 'react';
import { Grid, Card, CardContent, Typography, LinearProgress, Box } from '@mui/material';

export default function Dashboard() {
  const stats = {
    total: 42,
    inProgress: 27,
    completed: 15,
  };
  const completion = (stats.completed / stats.total) * 100;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Clients</Typography>
              <Typography variant="h3" color="primary">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">In Progress</Typography>
              <Typography variant="h3" color="primary">
                {stats.inProgress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Completed</Typography>
              <Typography variant="h3" color="primary">
                {stats.completed}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={completion} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
