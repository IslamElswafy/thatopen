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
          dispose: true,
        }
      });

      // Stocker la référence à l'API pour pouvoir la mettre à jour
      modelListRef.current = api;
      setModelListElement(modelist);
      
      // Mettre à jour explicitement la liste des modèles lorsque les fragments sont chargés/supprimés
      try {
        const fragmentsManager = components.get(OBC.FragmentsManager);
        
        if (fragmentsManager && fragmentsManager.onFragmentsLoaded && fragmentsManager.onFragmentsDisposed) {
          const onFragmentsLoaded = () => {
            if (modelListRef.current) {
              try {
                modelListRef.current.updateTable();
              } catch (e) {
                console.warn("Erreur lors de la mise à jour de la table après chargement:", e);
              }
            }
          };
          
// Dans le handler onFragmentsDisposed
const onFragmentsDisposed = () => {
  try {
    console.log("ModelList: Fragments supprimés");
    
    // Vérifier que modelListRef.current et updateTable existent
    if (modelListRef.current && typeof modelListRef.current.updateTable === 'function') {
      modelListRef.current.updateTable();
    } else {
      console.log("ModelList: updateTable non disponible, rafraîchissement manuel nécessaire");
      // Alternativement, recréer la liste ou effectuer une autre action
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la table après suppression:", error);
  }
};
          
          // Vérifier que les méthodes add et remove existent avant de les appeler
          if (typeof fragmentsManager.onFragmentsLoaded.add === 'function') {
            fragmentsManager.onFragmentsLoaded.add(onFragmentsLoaded);
          }
          
          if (typeof fragmentsManager.onFragmentsDisposed.add === 'function') {
            fragmentsManager.onFragmentsDisposed.add(onFragmentsDisposed);
          }
          
          return () => {
            // Vérifier que la méthode remove existe avant de l'appeler
            if (typeof fragmentsManager.onFragmentsLoaded.remove === 'function') {
              fragmentsManager.onFragmentsLoaded.remove(onFragmentsLoaded);
            }
            
            if (typeof fragmentsManager.onFragmentsDisposed.remove === 'function') {
              fragmentsManager.onFragmentsDisposed.remove(onFragmentsDisposed);
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