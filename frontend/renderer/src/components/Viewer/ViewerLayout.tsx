import { FC } from 'react';
import { Components, Worlds } from '@thatopen/components';
import { Box, Grid } from '@mui/material';
import { ClipperControl } from '../Controls/Clipper/ClipperControl';
import { IFCImport } from '../Controls/IFCImport';
import { ModelList } from '../Controls/ModelList';
import { ClassificationTree } from '../Classification/ClassificationTree';

interface ViewerLayoutProps {
  components: Components;
  world: Worlds;
  container: HTMLElement;
}

export const ViewerLayout: FC<ViewerLayoutProps> = ({
  components,
  world,
  container
}) => {
  return (
    <Box sx={{ 
      position: 'absolute', 
      top: 0, 
      right: 0, 
      width: '300px',
      height: '100%',
      overflowY: 'auto',
      bgcolor: 'background.default',
      boxShadow: 2,
      p: 1
    }}>
      <Grid container direction="column" spacing={2}>
        <Grid item>
          <IFCImport 
            components={components}
            onImportStart={() => console.log('Import started')}
            onImportComplete={() => console.log('Import completed')}
          />
        </Grid>
        <Grid item>
          <ClipperControl 
            components={components}
            world={world}
            container={container}
          />
        </Grid>
        <Grid item>
          <ModelList components={components} />
        </Grid>
        <Grid item>
          <ClassificationTree components={components} />
        </Grid>
      </Grid>
    </Box>
  );
};