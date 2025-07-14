import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box, Card, CardContent, List, ListItem, ListItemText } from '@mui/material';

export default function CustomerDetails() {
  const { id } = useParams();
  const timeline = [
    { date: '2024-06-01', text: 'Client signed up' },
    { date: '2024-06-15', text: 'Round 1 letters sent' },
    { date: '2024-07-20', text: 'Results received' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Client {id}
      </Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Timeline</Typography>
          <List>
            {timeline.map((t, i) => (
              <ListItem key={i} disableGutters>
                <ListItemText primary={t.text} secondary={t.date} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Latest Letter Preview</Typography>
          <Box sx={{ border: '1px solid', p: 2 }}>
            <Typography variant="body2">This is a preview of the dispute letter...</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
