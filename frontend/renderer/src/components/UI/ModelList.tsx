import { FC } from 'react';
import { Components } from '@thatopen/components';
import { Paper, Typography } from '@mui/material';
import { useModelList } from '../../hooks/useModelList';

interface ModelListProps {
  components: Components;
}

export const ModelList: FC<ModelListProps> = ({ components }) => {
  const { modelListElement } = useModelList(components);

  return (
    <Paper sx={{ p: 2, m: 1 }}>
      <Typography variant="h6" gutterBottom>
        Modèles chargés
      </Typography>
      <div ref={(node) => {
        if (node && modelListElement) node.appendChild(modelListElement);
      }} />
    </Paper>
  );
};