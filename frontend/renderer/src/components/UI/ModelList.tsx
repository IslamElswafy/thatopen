import { FC, useEffect, useState } from 'react';
import { Paper, Typography, Button, Box, Alert } from '@mui/material';
import * as OBC from '@thatopen/components';
import { useModelList } from '../../hooks/useModelList';

interface ModelListProps {
  components: OBC.Components;
  onDeleteModel?: (modelId: string) => void;
}

export const ModelList: FC<ModelListProps> = ({ components, onDeleteModel }) => {
  const [error, setError] = useState<string | null>(null);
  const { modelListElement, refreshModelList } = useModelList(components);

  // Écouter l'événement de demande de suppression
  useEffect(() => {
    const handleModelDelete = (e: CustomEvent) => {
      try {
        const { modelId } = e.detail;
        if (onDeleteModel) {
          onDeleteModel(modelId);
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        setError("Erreur lors de la suppression du modèle");
      }
    };

    document.addEventListener('model-delete-requested', handleModelDelete as EventListener);
    
    return () => {
      document.removeEventListener('model-delete-requested', handleModelDelete as EventListener);
    };
  }, [onDeleteModel]);

  return (
    <Paper sx={{ 
      p: 2, 
      m: 1,
      backgroundColor: '#616161', 
      color: 'white' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Modèles chargés
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          sx={{ color: 'white', borderColor: 'white' }}
          onClick={() => {
            try {
              refreshModelList();
            } catch (error) {
              console.error("Erreur lors du rafraîchissement:", error);
              setError("Erreur lors du rafraîchissement de la liste");
            }
          }}>
          Actualiser
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2, backgroundColor: '#424242', color: 'white' }}>
          {error}
        </Alert>
      )}
      
      <div ref={(node) => {
        if (node && modelListElement && !node.contains(modelListElement)) {
          try {
            node.innerHTML = '';
            node.appendChild(modelListElement);
          } catch (error) {
            console.error("Erreur lors de l'ajout du modelListElement:", error);
            setError("Erreur lors de l'affichage de la liste des modèles");
          }
        }
      }} />
    </Paper>
  );
};