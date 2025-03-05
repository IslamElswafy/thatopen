import { useEffect, useState, useRef } from 'react';
import { Components } from '@thatopen/components';
import * as OBC from '@thatopen/components';
import * as CUI from '@thatopen/ui-obc';
import * as React from 'react';

interface Classification {
  system: string;
  label: string;
}

interface UseClassificationTreeSimpleProps {
  components: Components | null;
  updateTrigger?: number;
}

export const useClassificationTreeSimple = ({ components, updateTrigger = 0 }: UseClassificationTreeSimpleProps) => {
  // État pour forcer la mise à jour du composant
  const [updateKey, setUpdateKey] = useState(0);
  const [classifications, setClassifications] = useState<Classification[]>([
    { system: 'entities', label: 'Entities' },
    { system: 'predefinedTypes', label: 'Predefined Types' },
  ]);
  
  // Références
  const fragmentsLoadedHandlerRef = useRef<((model: any) => void) | null>(null);
  const fragmentsDisposedHandlerRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const initDoneRef = useRef(false);

  // Effet de montage/démontage
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Effet pour gérer les abonnements aux événements
  useEffect(() => {
    if (!components || initDoneRef.current) return;
    
    try {
      console.log("ClassificationTree: Configuration des événements");
      
      const classifier = components.get(OBC.Classifier);
      const fragmentsManager = components.get(OBC.FragmentsManager);
      
      if (!classifier || !fragmentsManager) return;
      
      // Fonction pour mettre à jour après chargement de fragments
      const handleFragmentsLoaded = async (model: any) => {
        try {
          if (!mountedRef.current) return;
          
          console.log("ClassificationTree: Fragments chargés");
          
          // Créer les classifications pour ce modèle
          classifier.byEntity(model);
          await classifier.byPredefinedType(model);
          
          // Forcer la mise à jour du composant
          if (mountedRef.current) {
            setUpdateKey(prev => prev + 1);
          }
        } catch (e) {
          console.warn("ClassificationTree: Erreur lors de la mise à jour après chargement", e);
        }
      };
      
      // Fonction pour nettoyer après suppression
      const handleFragmentsDisposed = () => {
        try {
          if (!mountedRef.current) return;
          
          console.log("ClassificationTree: Fragments supprimés");
          
          // Vérifier s'il reste des modèles
          const remainingModels = Object.keys(fragmentsManager.groups).length;
          
          if (remainingModels === 0) {
            // Plus de modèle, réinitialiser le classifier
            classifier.list = {};
          }
          
          // Forcer la mise à jour du composant
          if (mountedRef.current) {
            setUpdateKey(prev => prev + 1);
          }
        } catch (e) {
          console.warn("ClassificationTree: Erreur lors du nettoyage après suppression", e);
        }
      };
      
      // Stocker les références aux handlers
      fragmentsLoadedHandlerRef.current = handleFragmentsLoaded;
      fragmentsDisposedHandlerRef.current = handleFragmentsDisposed;
      
      // Abonner aux événements
      fragmentsManager.onFragmentsLoaded.add(handleFragmentsLoaded);
      fragmentsManager.onFragmentsDisposed.add(handleFragmentsDisposed);
      
      // Traiter tous les modèles déjà chargés
      fragmentsManager.groups.forEach(model => {
        handleFragmentsLoaded(model);
      });
      
      initDoneRef.current = true;
      
      // Nettoyage
      return () => {
        if (fragmentsManager) {
          if (fragmentsLoadedHandlerRef.current) {
            fragmentsManager.onFragmentsLoaded.remove(fragmentsLoadedHandlerRef.current);
          }
          if (fragmentsDisposedHandlerRef.current) {
            fragmentsManager.onFragmentsDisposed.remove(fragmentsDisposedHandlerRef.current);
          }
        }
      };
    } catch (e) {
      console.error("ClassificationTree: Erreur lors de l'initialisation", e);
    }
  }, [components]);
  
  // Effet pour la mise à jour forcée via updateTrigger
  useEffect(() => {
    if (!updateTrigger || !components) return;
    
    try {
      console.log("ClassificationTree: Mise à jour forcée", updateTrigger);
      
      const classifier = components.get(OBC.Classifier);
      const fragmentsManager = components.get(OBC.FragmentsManager);
      
      if (!classifier || !fragmentsManager) return;
      
      // S'il n'y a pas de modèles, réinitialiser le classifier
      if  (Object.keys(fragmentsManager.groups).length === 0) {
        classifier.list = {};
      } else {
        // Reconstruire pour tous les modèles
        fragmentsManager.groups.forEach(model => {
          classifier.byEntity(model);
          classifier.byPredefinedType(model);
        });
      }
      
      // Mettre à jour le classifier - SUPPRESSION DE LA LIGNE PROBLÉMATIQUE
      // La méthode update() n'existe pas dans l'API récente
      // classifier.update();
      
      // Forcer la mise à jour du composant React
      setUpdateKey(prev => prev + 1);
    } catch (e) {
      console.warn("ClassificationTree: Erreur lors de la mise à jour forcée", e);
    }
  }, [components, updateTrigger]);
  
  // Fonction pour mettre à jour les données de classification manuellement
  const updateClassificationData = (newClassifications: Classification[] = classifications) => {
    setClassifications(newClassifications);
    setUpdateKey(prev => prev + 1);
  };
  
  // Composant pour afficher l'arbre de classification
  const ClassificationTreeComponent = React.memo(() => {
    const containerRef = useRef<HTMLDivElement>(null);
    const classifier = components?.get(OBC.Classifier);
    const fragmentsManager = components?.get(OBC.FragmentsManager);
    
    // Vérifier si nous avons des modèles pour afficher un message approprié
    const hasModels = fragmentsManager && Object.keys(fragmentsManager.groups).length > 0;
    
    useEffect(() => {
      if (!containerRef.current || !components) return;
      
      try {
        // Nettoyer le conteneur
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        
        // Créer l'arbre seulement si nous avons des modèles
        if (hasModels) {
          const [tree] = CUI.tables.classificationTree({
            components,
            classifications,
          });
          
          // Ajouter l'arbre au conteneur
          containerRef.current.appendChild(tree);
        }
      } catch (e) {
        console.error("ClassificationTree: Erreur lors du rendu", e);
      }
    }, [components, classifications, hasModels]); // Dépendances valides
    
    // Si aucun modèle n'est chargé, afficher un message
    if (!hasModels) {
      return <div>Aucun modèle chargé pour afficher la classification.</div>;
    }
    
    return (
      <div 
        ref={containerRef} 
        style={{ 
          minHeight: "50px", 
          maxHeight: "400px", 
          overflowY: "auto" 
        }} 
        data-testid="classification-tree-container"
      />
    );
  });
  
  return {
    ClassificationTreeComponent: () => <ClassificationTreeComponent key={updateKey} />,
    updateClassificationData
  };
};