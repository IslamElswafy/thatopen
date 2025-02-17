import { FC } from 'react';
import { Dialog, CircularProgress, Typography, Box } from '@mui/material';

export const LoadingDialog: FC = () => {
  return (
    <Dialog open={true} disableEscapeKeyDown>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <CircularProgress />
        <Typography>Chargement du modèle IFC en cours...</Typography>
      </Box>
    </Dialog>
  );
};