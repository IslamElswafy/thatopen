import { useState, useEffect, useRef } from 'react';
import * as OBC from '@thatopen/components';
import * as CUI from '@thatopen/ui-obc';

export const useModelList = (components: OBC.Components | null) => {
  const [modelListElement, setModelListElement] = useState<HTMLElement | null>(null);
  const modelListRef = useRef<any>(null);

  useEffect(() => {
    if (!components) return;
    
    try {
      // Créer la liste des modèles
      const [modelist, api] = CUI.tables.modelsList({
        components,
        tags: { 
          schema: true, 
          viewDefinition: false 
        },
        actions: { 
          download: false,
          delete: {
            enabled: true,
            action: (model) => {
              // Déclencher un événement personnalisé pour la suppression
              const event = new CustomEvent('model-delete-requested', { 
                detail: { modelId: model.uuid }
              });
              document.dispatchEvent(event);
            }
          }
        }
      });

      // Stocker la référence à l'API pour pouvoir la mettre à jour
      modelListRef.current = api;
      setModelListElement(modelist);
      
      // Mettre à jour explicitement la liste des modèles lorsque les fragments sont chargés/supprimés
      try {
        const fragmentsManager = components.get(OBC.FragmentsManager);
        
        if (fragmentsManager && fragmentsManager.onFragmentsLoaded && fragmentsManager.onFragmentsRemoved) {
          const onFragmentsLoaded = () => {
            if (modelListRef.current) {
              try {
                modelListRef.current.updateTable();
              } catch (e) {
                console.warn("Erreur lors de la mise à jour de la table après chargement:", e);
              }
            }
          };
          
          const onFragmentsRemoved = () => {
            if (modelListRef.current) {
              try {
                modelListRef.current.updateTable();
              } catch (e) {
                console.warn("Erreur lors de la mise à jour de la table après suppression:", e);
              }
            }
          };
          
          // Vérifier que les méthodes add et remove existent avant de les appeler
          if (typeof fragmentsManager.onFragmentsLoaded.add === 'function') {
            fragmentsManager.onFragmentsLoaded.add(onFragmentsLoaded);
          }
          
          if (typeof fragmentsManager.onFragmentsRemoved.add === 'function') {
            fragmentsManager.onFragmentsRemoved.add(onFragmentsRemoved);
          }
          
          return () => {
            // Vérifier que la méthode remove existe avant de l'appeler
            if (typeof fragmentsManager.onFragmentsLoaded.remove === 'function') {
              fragmentsManager.onFragmentsLoaded.remove(onFragmentsLoaded);
            }
            
            if (typeof fragmentsManager.onFragmentsRemoved.remove === 'function') {
              fragmentsManager.onFragmentsRemoved.remove(onFragmentsRemoved);
            }
            
            modelListElement?.remove();
          };
        }
      } catch (error) {
        console.warn("Erreur lors de l'accès au FragmentsManager:", error);
      }
    } catch (error) {
      console.error("Erreur lors de la création de la liste des modèles:", error);
    }
    
    return () => {
      modelListElement?.remove();
    };
  }, [components]);

  // Fonction pour forcer la mise à jour de la liste
  const refreshModelList = () => {
    if (modelListRef.current) {
      try {
        modelListRef.current.updateTable();
      } catch (error) {
        console.warn("Erreur lors de la mise à jour de la table:", error);
      }
    }
  };

  return { modelListElement, refreshModelList };
};