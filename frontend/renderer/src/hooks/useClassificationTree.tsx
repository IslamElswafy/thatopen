import { useEffect, useState, useRef } from 'react';
import { Components } from '@thatopen/components';
import * as CUI from '@thatopen/ui-obc';
import * as OBC from '@thatopen/components';
import React from 'react';

interface Classification {
  system: string;
  label: string;
}

export const useClassificationTree = (components: Components | null) => {
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [treeElement, setTreeElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!components) return;
    const classifier = components.get(OBC.Classifier);
    const fragmentsManager = components.get(OBC.FragmentsManager);
    if (!classifier || !fragmentsManager) return;

    // Création initiale du tree via la méthode recommandée
    const [classificationsTree, updateClassificationsTree] = CUI.tables.classificationTree({
      components,
      classifications: [],
    });
    setTreeElement(classificationsTree);

    // Abonnement à l'événement de chargement des fragments
    const handleFragmentsLoaded = async (model: any) => {
      // Création de la classification "entities"
      classifier.byEntity(model);
      // Création de la classification "predefinedTypes"
      await classifier.byPredefinedType(model);

      // Définition des classifications à afficher
      const updatedClassifications = [
        { system: 'entities', label: 'Entities' },
        { system: 'predefinedTypes', label: 'Predefined Types' },
      ];

      // Mise à jour de l'état et de l'affichage du tree
      setClassifications(updatedClassifications);
      updateClassificationsTree({ classifications: updatedClassifications });
    };

    fragmentsManager.onFragmentsLoaded.add(handleFragmentsLoaded);
    return () => {
      fragmentsManager.onFragmentsLoaded.remove(handleFragmentsLoaded);
    };
  }, [components]);

  return { treeElement, classifications };
};

// Ajout du nouvel hook compatible avec React
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
  
  // Références pour les gestionnaires d'événements
  const fragmentsLoadedHandlerRef = useRef<((model: any) => void) | null>(null);
  const fragmentsDisposedHandlerRef = useRef<(() => void) | null>(null);

  // Effet pour gérer les abonnements aux événements
  useEffect(() => {
    if (!components) return;
    
    try {
      const classifier = components.get(OBC.Classifier);
      const fragmentsManager = components.get(OBC.FragmentsManager);
      
      if (!classifier || !fragmentsManager) return;
      
      console.log("ClassificationTree: Configuration des événements");
      
      // Fonction pour mettre à jour après chargement de fragments
      const handleFragmentsLoaded = async (model: any) => {
        console.log("ClassificationTree: Fragments chargés");
        
        try {
          // Créer les classifications pour ce modèle
          classifier.byEntity(model);
          await classifier.byPredefinedType(model);
          
          // Forcer la mise à jour du composant
          setUpdateKey(prev => prev + 1);
        } catch (e) {
          console.warn("ClassificationTree: Erreur lors de la mise à jour après chargement", e);
        }
      };
      
      // Fonction pour nettoyer après suppression
      const handleFragmentsDisposed = () => {
        console.log("ClassificationTree: Fragments supprimés");
        
        try {
          // Vérifier s'il reste des modèles
          const remainingModels = fragmentsManager.groups;
          
          if (remainingModels.length === 0) {
            // Plus de modèle, réinitialiser le classifier
            classifier.systems = {};
          }
          
          // Mettre à jour le classificateur
          classifier.update();
          
          // Forcer la mise à jour du composant
          setUpdateKey(prev => prev + 1);
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
      if (fragmentsManager.groups.length === 0) {
        classifier.systems = {};
      } else {
        // Reconstruire pour tous les modèles
        fragmentsManager.groups.forEach(model => {
          classifier.byEntity(model);
          classifier.byPredefinedType(model);
        });
      }
      
      // Mettre à jour le classifier
      classifier.update();
      
      // Forcer la mise à jour du composant
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
    
    useEffect(() => {
      if (!containerRef.current || !components) return;
      
      try {
        // Nettoyer le conteneur
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        
        // Créer l'arbre
        const [tree] = CUI.tables.classificationTree({
          components,
          classifications,
        });
        
        // Ajouter l'arbre au conteneur
        containerRef.current.appendChild(tree);
      } catch (e) {
        console.error("ClassificationTree: Erreur lors du rendu", e);
      }
    }, [updateKey]);
    
    return (
      <div 
        ref={containerRef} 
        style={{ 
          minHeight: "50px", 
          maxHeight: "400px", 
          overflowY: "auto" 
        }} 
      />
    );
  });
  
  return {
    ClassificationTreeComponent,
    updateClassificationData
  };
};