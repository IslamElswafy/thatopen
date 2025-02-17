import { FC, ReactNode } from 'react';
import { Paper, Box, Typography } from '@mui/material';

interface SectionProps {
  label: string;
  children: ReactNode;
}

export const Section: FC<SectionProps> = ({ label, children }) => {
  return (
    <Paper 
      sx={{ 
        mb: 1,
        overflow: 'hidden',
        backgroundColor: 'background.paper' 
      }}
    >
      <Box
        sx={{
          p: 1,
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}
      >
        <Typography variant="subtitle2">{label}</Typography>
      </Box>
      <Box sx={{ p: 1 }}>
        {children}
      </Box>
    </Paper>
  );
};