import React, { FC, useEffect, useState } from 'react';
import { Components } from '@thatopen/components';
import { useModelList } from '../../hooks/useModelList';

interface ModelListProps {
  components: Components | null;
  onDeleteModel?: (modelId: string) => void;
}

export const ModelList: FC<ModelListProps> = ({ components, onDeleteModel }) => {
  const [error, setError] = useState<string | null>(null);
  const { modelListElement, refreshModelList } = useModelList(components);

  // Écouter l'événement de demande de suppression
  useEffect(() => {
    const handleModelDelete = async (e: CustomEvent) => {
      try {
        if (!e || !e.detail) {
          console.warn("ModelList: Événement de suppression invalide");
          return;
        }
        
        const { modelId } = e.detail;
        
        if (!modelId) {
          console.warn("ModelList: ID de modèle manquant dans l'événement");
          return;
        }
        
        console.log(`ModelList: Demande de suppression du modèle ${modelId}`);
        setError(null);
        
        // Appeler le handler de suppression fourni par le parent
        if (onDeleteModel) {
          await onDeleteModel(modelId);
          
          // Après la suppression réussie, vérification robuste
          const fragmentsManager = components?.get(OBC.FragmentsManager);
          const noModelsLeft = !fragmentsManager || Object.keys(fragmentsManager.groups || {}).length === 0;
          
          console.log("ModelList: État après suppression:", { 
            modelId, 
            noModelsLeft, 
            groupCount: fragmentsManager ? Object.keys(fragmentsManager.groups || {}).length : 0 
          });
          
          // Force refresh complet
          refreshModelList();
          
          // Émissions explicites d'événements dans l'ordre correct
          if (noModelsLeft) {
            console.log("ModelList: Tous les modèles supprimés, émission d'événements");
            // Événement spécifique pour certification de la mise à jour du classificateur
            document.dispatchEvent(new CustomEvent('model-classifications-update'));
            // Petit délai pour assurer la synchronisation
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('all-models-removed'));
            }, 10);
          }
        } else {
          console.warn(`ModelList: Aucun gestionnaire de suppression défini pour le modèle ${modelId}`);
        }
        
        // Rafraîchir la liste après suppression
        refreshModelList();
        
      } catch (error) {
        console.error("ModelList: Erreur lors de la suppression", error);
        setError("Erreur lors de la suppression du modèle");
      }
    };

    document.addEventListener('model-delete-requested', handleModelDelete as EventListener);
    
    return () => {
      document.removeEventListener('model-delete-requested', handleModelDelete as EventListener);
    };
  }, [onDeleteModel, refreshModelList, components]);

  // Afficher l'élément de liste de modèles
  return (
    <div className="model-list-container">
      <div 
        ref={node => { 
          try {
            // Si le nœud existe et que modelListElement existe, attacher modelListElement au nœud
            if (node && modelListElement) {
              // S'assurer que le nœud est vide avant d'ajouter modelListElement
              if (!node.contains(modelListElement)) {
                node.innerHTML = '';
                node.appendChild(modelListElement);
              }
            }
          } catch (err) {
            console.error("ModelList: Erreur lors de l'attachement de l'élément", err);
          }
        }} 
        className="model-list"
        data-testid="model-list"
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};