import { FC, useCallback } from 'react';
import { Components } from '@thatopen/components';
import { Box, Paper, Typography } from '@mui/material';
import { useClassificationTree } from '../../hooks/useClassificationTree';

interface ClassificationTreeProps {
  components: Components;
}

export const ClassificationTree: FC<ClassificationTreeProps> = ({ components }) => {
  const { treeElement } = useClassificationTree(components);

  const handleRef = useCallback((node: HTMLElement | null) => {
    if (node && treeElement) {
      node.appendChild(treeElement);
    }
  }, [treeElement]);

  return (
    <Paper sx={{ p: 2, m: 1 }}>
      <Typography variant="h6" gutterBottom>
        Classification IFC
      </Typography>
      <Box ref={handleRef} />
    </Paper>
  );
};