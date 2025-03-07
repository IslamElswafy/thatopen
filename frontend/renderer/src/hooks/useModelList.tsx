import { useState, useEffect, useRef, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as CUI from '@thatopen/ui-obc';

export const useModelList = (components: OBC.Components | null) => {
  const [modelListElement, setModelListElement] = useState<HTMLElement | null>(null);
  const modelListRef = useRef<{ updateTable?: () => void } | null>(null);
  const initDoneRef = useRef(false);
  const mountedRef = useRef(true);

  // Effet de montage/démontage
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialisation et abonnement aux événements
  useEffect(() => {
    if (!components || initDoneRef.current) return;

    try {
      console.log("ModelList: Initialisation");
      
      const fragmentsManager = components.get(OBC.FragmentsManager);
      
      if (!fragmentsManager) {
        console.warn("ModelList: FragmentsManager non disponible");
        return;
      }
      
      // Créer la liste des modèles
      let element: HTMLElement | null = null;
      let api: { updateTable?: () => void } = {};
      
      try {
        // Capturer les erreurs potentielles lors de la création de la liste
        const result = CUI.tables.modelsList({
          components,
          async onClickElement([model]) {
            console.log("ModelList: Modèle sélectionné", model?.uuid);
          },
        });
        
        // Validation du résultat
        if (Array.isArray(result) && result.length >= 2) {
          element = result[0] as HTMLElement;
          api = result[1] as { updateTable?: () => void };
        } else {
          throw new Error("Format de retour inattendu pour modelsList");
        }
      } catch (error) {
        console.error("Erreur lors de la création de la liste de modèles:", error);
        
        // Créer un élément de secours
        element = document.createElement('div');
        element.textContent = "Liste des modèles indisponible";
        element.style.padding = "10px";
        element.style.color = "white";
        
        // API de secours
        api = {
          updateTable: () => {
            console.log("ModelList: Méthode updateTable de secours appelée");
          }
        };
      }
      
      // Toujours définir une méthode updateTable pour éviter les erreurs
      if (!api || typeof api.updateTable !== 'function') {
        console.warn("ModelList: API invalide, création d'une méthode updateTable de secours");
        api = api || {};
        api.updateTable = () => {
          console.log("ModelList: Méthode updateTable de secours appelée");
        };
      }
      
      // Stocker l'élément et l'API
      setModelListElement(element);
      modelListRef.current = api;
      
      // Fonction pour mettre à jour après chargement de fragments
      const onFragmentsLoaded = (model: any) => {
        try {
          if (!mountedRef.current) return;
          
          console.log("ModelList: Fragments chargés", model?.uuid);
          
          // Mise à jour sécurisée de la table
          if (modelListRef.current && typeof modelListRef.current.updateTable === 'function') {
            modelListRef.current.updateTable();
          } else {
            console.warn("ModelList: updateTable non disponible après chargement");
          }
        } catch (error) {
          console.error("ModelList: Erreur lors de la mise à jour après chargement", error);
        }
      };
      
      // Fonction pour nettoyer après suppression
      const onFragmentsDisposed = (event: any) => {
        try {
          if (!mountedRef.current) return;
          
          console.log("ModelList: Fragments supprimés", event?.groupID);
          
          // Mise à jour sécurisée de la table
          if (modelListRef.current && typeof modelListRef.current.updateTable === 'function') {
            modelListRef.current.updateTable();
          } else {
            console.warn("ModelList: updateTable non disponible après suppression");
          }
          
          // Émettre l'événement pour informer les autres composants
          try {
            document.dispatchEvent(new CustomEvent('model-classifications-update'));
          } catch (e) {
            console.error("ModelList: Erreur lors de l'émission de l'événement", e);
          }
        } catch (error) {
          console.error("ModelList: Erreur lors de la mise à jour après suppression", error);
        }
      };
      
      // Abonner aux événements
      fragmentsManager.onFragmentsLoaded.add(onFragmentsLoaded);
      fragmentsManager.onFragmentsDisposed.add(onFragmentsDisposed);
      
      initDoneRef.current = true;
      
      // Nettoyage
      return () => {
        if (fragmentsManager && mountedRef.current) {
          fragmentsManager.onFragmentsLoaded.remove(onFragmentsLoaded);
          fragmentsManager.onFragmentsDisposed.remove(onFragmentsDisposed);
        }
      };
    } catch (error) {
      console.error("ModelList: Erreur lors de l'initialisation", error);
    }
  }, [components]);

  // Fonction pour rafraîchir manuellement la liste des modèles
  const refreshModelList = useCallback(() => {
    try {
      console.log("ModelList: Rafraîchissement manuel");
      
      // Mise à jour sécurisée de la table
      if (modelListRef.current && typeof modelListRef.current.updateTable === 'function') {
        modelListRef.current.updateTable();
      } else {
        console.warn("ModelList: updateTable non disponible pour le rafraîchissement manuel");
      }
      
      // Émettre l'événement pour mettre à jour les classifications
      try {
        document.dispatchEvent(new CustomEvent('model-classifications-update'));
      } catch (e) {
        console.error("ModelList: Erreur lors de l'émission de l'événement", e);
      }
    } catch (error) {
      console.error("ModelList: Erreur lors du rafraîchissement manuel", error);
    }
  }, []);

  return { modelListElement, refreshModelList };
};