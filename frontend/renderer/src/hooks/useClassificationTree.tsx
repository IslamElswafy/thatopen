import { useEffect, useState, useRef, useCallback } from 'react';
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
  // États
  const [updateKey, setUpdateKey] = useState(0);
  const [hasModels, setHasModels] = useState(false);
  const [hasClassifications, setHasClassifications] = useState(false);
  const [classifications, setClassifications] = useState<Classification[]>([
    { system: 'entities', label: 'Entities' },
    { system: 'predefinedTypes', label: 'Predefined Types' },
  ]);

  // Références
  const fragmentsLoadedHandlerRef = useRef<((model: any) => void) | null>(null);
  const fragmentsDisposedHandlerRef = useRef<((event?: any) => void) | null>(null);
  const mountedRef = useRef(true);
  const initDoneRef = useRef(false);
  const forcedUpdateCountRef = useRef(0);
  
  // Fonction pour mettre à jour les données de classification
  const updateClassificationData = useCallback((newClassifications?: Classification[]) => {
    if (!components || !mountedRef.current) return false;

    try {
      console.log("ClassificationTree: Mise à jour des données de classification");
      
      if (newClassifications) {
        setClassifications(newClassifications);
      }
      
      // Calculer l'état hasModels directement à partir des données actuelles
      const fragmentsManager = components?.get(OBC.FragmentsManager);
      const classifier = components?.get(OBC.Classifier);
      
      if (!fragmentsManager || !classifier) {
        console.warn("ClassificationTree: Composants requis non disponibles");
        return false;
      }
      
      const modelCount = fragmentsManager ? Object.keys(fragmentsManager.groups || {}).length : 0;
      
      console.log(`ClassificationTree: ${modelCount} modèles détectés`);
      setHasModels(modelCount > 0);
      
      // Vérifier si nous avons des classifications
      const hasClassificationsData = classifier && 
                                   classifier.list && 
                                   ((classifier.list.entities && Object.keys(classifier.list.entities).length > 0) || 
                                    (classifier.list.predefinedTypes && Object.keys(classifier.list.predefinedTypes).length > 0));
      
      setHasClassifications(Boolean(hasClassificationsData));
      
      // Forcer la mise à jour du composant
      setUpdateKey(Date.now());
      
      return true;
    } catch (error) {
      console.error("ClassificationTree: Erreur lors de la mise à jour des données", error);
      return false;
    }
  }, [components]);

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

      if (!classifier || !fragmentsManager) {
        console.warn("ClassificationTree: Composants requis non disponibles");
        return;
      }

      // Fonction pour mettre à jour après chargement de fragments
      const handleFragmentsLoaded = async (model: any) => {
        try {
          if (!mountedRef.current) return;

          console.log("ClassificationTree: Fragments chargés", model?.uuid);
          
          if (!model) {
            console.warn("ClassificationTree: Modèle invalide");
            return;
          }
          
          // Vérifier si le modèle a les propriétés attendues
          if (!model.data) {
            console.warn("ClassificationTree: Le modèle n'a pas de données exploitables", model);
            
            // Créer une structure minimale pour éviter les erreurs
            try {
              // Malgré l'absence de données, tenter la classification
              classifier.byEntity(model);
              await classifier.byPredefinedType(model);
            } catch (classificationError) {
              console.warn("ClassificationTree: Classification impossible", classificationError);
            }
            
            // Mettre à jour l'interface même sans classification
            updateClassificationData();
            return;
          }
          
          // Si le modèle a des données, tenter la classification normale
          try {
            classifier.byEntity(model);
            await classifier.byPredefinedType(model);
          } catch (e) {
            console.warn("ClassificationTree: Erreur lors de la classification", e);
          }

          // Mettre à jour l'interface
          updateClassificationData();
        } catch (e) {
          console.warn("ClassificationTree: Erreur lors de la mise à jour après chargement", e);
        }
      };

      // Fonction pour nettoyer après suppression
      const handleFragmentsDisposed = (event: any) => {
        try {
          if (!mountedRef.current) return;

          console.log("ClassificationTree: Fragments supprimés", event?.groupID || "inconnu");
          
          // Limiter le nombre de mises à jour forcées pour éviter les boucles infinies
          forcedUpdateCountRef.current++;
          if (forcedUpdateCountRef.current > 10) {
            console.warn("ClassificationTree: Trop de mises à jour forcées, opération ignorée");
            return;
          }

          const classifier = components.get(OBC.Classifier);
          const fragmentsManager = components.get(OBC.FragmentsManager);

          if (!classifier || !fragmentsManager) {
            console.warn("ClassificationTree: Composants requis non disponibles lors de la suppression");
            return;
          }

          // Vérifier s'il reste des modèles après la suppression
          const remainingModelsCount = Object.keys(fragmentsManager.groups || {}).length;
          console.log(`ClassificationTree: ${remainingModelsCount} modèles restants après suppression`);

          // Mettre à jour immédiatement l'état hasModels
          setHasModels(remainingModelsCount > 0);

          if (remainingModelsCount === 0) {
            // Plus de modèle, réinitialiser le classifier
            console.log("ClassificationTree: Plus aucun modèle, réinitialisation du classifier");
            classifier.list = { entities: {}, predefinedTypes: {} };
            setHasClassifications(false);
          } else {
            // Reconstruire pour les modèles restants de manière synchrone
            console.log("ClassificationTree: Reconstruction pour les modèles restants");
            
            try {
              // Réinitialiser le classifier de façon sécurisée
              classifier.list = { entities: {}, predefinedTypes: {} };
              
              // Puis reconstruire pour chaque modèle restant avec gestion d'erreurs
              Object.values(fragmentsManager.groups || {}).forEach(model => {
                try {
                  if (model && model.userData && model.userData.type === 'FragmentsGroup') {
                    try {
                      classifier.byEntity(model);
                      classifier.byPredefinedType(model);
                    } catch (classifierError) {
                      console.warn("ClassificationTree: Erreur lors de la classification d'un modèle", classifierError);
                    }
                  }
                } catch (modelError) {
                  console.warn("ClassificationTree: Erreur lors du traitement d'un modèle", modelError);
                }
              });
            } catch (e) {
              console.warn("ClassificationTree: Erreur lors de la reconstruction", e);
            }
          }

          // Mise à jour immédiate
          updateClassificationData();
          
          // Émettre l'événement pour les autres composants
          try {
            document.dispatchEvent(new CustomEvent('model-classifications-update'));
          } catch (eventError) {
            console.error("ClassificationTree: Erreur lors de l'émission de l'événement", eventError);
          }
          
          // Réinitialiser le compteur après un certain temps
          setTimeout(() => {
            if (mountedRef.current) {
              forcedUpdateCountRef.current = 0;
            }
          }, 2000);
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
      Object.values(fragmentsManager.groups || {}).forEach(model => {
        handleFragmentsLoaded(model);
      });

      initDoneRef.current = true;

      // Nettoyage
      return () => {
        if (fragmentsManager && mountedRef.current) {
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
  }, [components, updateClassificationData]);

  // Effet pour la mise à jour forcée via updateTrigger
  useEffect(() => {
    if (!updateTrigger || !components || !mountedRef.current) return;

    try {
      console.log("ClassificationTree: Mise à jour forcée", updateTrigger);

      const classifier = components.get(OBC.Classifier);
      const fragmentsManager = components.get(OBC.FragmentsManager);

      if (!classifier || !fragmentsManager) return;

      // Traitement synchrone avec gestion d'erreurs
      try {
        const modelCount = Object.keys(fragmentsManager.groups || {}).length;
        
        if (modelCount === 0) {
          classifier.list = { entities: {}, predefinedTypes: {} };
          setHasClassifications(false);
        } else {
          Object.values(fragmentsManager.groups || {}).forEach(model => {
            try {
              if (model && model.userData && model.userData.type === 'FragmentsGroup') {
                classifier.byEntity(model);
                classifier.byPredefinedType(model);
              }
            } catch (modelError) {
              console.warn("ClassificationTree: Erreur lors du traitement d'un modèle", modelError);
            }
          });
        }
      } catch (e) {
        console.warn("ClassificationTree: Erreur lors de la reconstruction des classifications", e);
      }

      // Mise à jour immédiate
      updateClassificationData();
    } catch (e) {
      console.warn("ClassificationTree: Erreur lors de la mise à jour forcée", e);
    }
  }, [components, updateTrigger, updateClassificationData]);

  // Écouteur d'événement model-classifications-update
  useEffect(() => {
    if (!components || !mountedRef.current) return;
    
    const handleClassificationsUpdate = () => {
      if (!mountedRef.current) return;
      
      console.log("ClassificationTree: Événement model-classifications-update reçu");
      
      try {
        // Calcul direct de hasModels
        const fragmentsManager = components?.get(OBC.FragmentsManager);
        const classifier = components?.get(OBC.Classifier);
        
        if (!fragmentsManager || !classifier) {
          console.warn("ClassificationTree: Composants requis non disponibles lors de l'événement");
          return;
        }
        
        const modelCount = Object.keys(fragmentsManager.groups || {}).length;
        
        console.log(`ClassificationTree: ${modelCount} modèles détectés après événement`);
        setHasModels(modelCount > 0);
        
        // Vérifier si nous avons des classifications
        const hasClassificationsData = classifier && 
                                     classifier.list && 
                                     ((classifier.list.entities && Object.keys(classifier.list.entities).length > 0) || 
                                      (classifier.list.predefinedTypes && Object.keys(classifier.list.predefinedTypes).length > 0));
        
        setHasClassifications(Boolean(hasClassificationsData));
        
        // Forcer la mise à jour du composant
        setUpdateKey(Date.now());
      } catch (error) {
        console.error("ClassificationTree: Erreur lors du traitement de l'événement", error);
      }
    };

    document.addEventListener('model-classifications-update', handleClassificationsUpdate);

    return () => {
      document.removeEventListener('model-classifications-update', handleClassificationsUpdate);
    };
  }, [components]);

  // Réinitialiser le compteur de mises à jour forcées après un certain temps d'inactivité
  useEffect(() => {
    const resetInterval = setInterval(() => {
      if (mountedRef.current) {
        forcedUpdateCountRef.current = 0;
      }
    }, 10000);
    
    return () => {
      clearInterval(resetInterval);
    };
  }, []);

  // Composant pour afficher l'arbre de classification
  const ClassificationTreeComponent = useCallback(() => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Obtenir les gestionnaires directement dans le rendu pour avoir les données les plus récentes
    const fragmentsManager = components?.get(OBC.FragmentsManager);
    const classifier = components?.get(OBC.Classifier);
    
    // Calcul direct dans le composant pour être sûr d'avoir les valeurs à jour
    const currentHasModels = fragmentsManager && Object.keys(fragmentsManager.groups || {}).length > 0;
    
    const currentHasClassifications = classifier && 
                                    classifier.list && 
                                    ((classifier.list.entities && Object.keys(classifier.list.entities).length > 0) || 
                                     (classifier.list.predefinedTypes && Object.keys(classifier.list.predefinedTypes).length > 0));
    
    // Log pour débogage
    console.log("ClassificationTree: Rendu avec", { 
      hasModels, 
      currentHasModels, 
      modelCount: fragmentsManager ? Object.keys(fragmentsManager.groups || {}).length : 0,
      hasClassifications,
      currentHasClassifications,
      updateKey
    });

    // Effet pour créer l'arbre de classification
    useEffect(() => {
      if (!containerRef.current || !components) return;

      try {
        // Nettoyer le conteneur
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }

        // Créer l'arbre seulement si nous avons des modèles ET des classifications
        if (currentHasModels && currentHasClassifications) {
          console.log("ClassificationTree: Création de l'arbre de classification");
          
          try {
            const [tree] = CUI.tables.classificationTree({
              components,
              classifications,
            });

            if (containerRef.current) {
              containerRef.current.appendChild(tree);
            }
          } catch (treeError) {
            console.error("ClassificationTree: Erreur lors de la création de l'arbre", treeError);
            
            // Afficher un message d'erreur dans le conteneur
            const errorDiv = document.createElement('div');
            errorDiv.style.padding = '10px';
            errorDiv.style.color = 'red';
            errorDiv.textContent = "Erreur lors du chargement de l'arbre de classification";
            
            if (containerRef.current) {
              containerRef.current.appendChild(errorDiv);
            }
          }
        } else {
          console.log("ClassificationTree: Pas de données pour l'arbre", 
            { hasModels: currentHasModels, hasClassifications: currentHasClassifications });
        }
      } catch (e) {
        console.error("ClassificationTree: Erreur lors du rendu", e);
      }
    }, [components, classifications, currentHasModels, currentHasClassifications, updateKey]);

    // La détection finale utilise à la fois l'état global hasModels et le calcul direct currentHasModels
    // pour maximiser les chances de détecter correctement l'absence de modèles
    const effectiveHasModels = hasModels || currentHasModels;

    // Si aucun modèle n'est chargé, afficher le message
    if (!effectiveHasModels) {
      console.log("ClassificationTree: Affichage du message 'Aucun modèle chargé'");
      return (
        <div style={{ 
          padding: '16px', 
          margin: '8px', 
          backgroundColor: '#616161', 
          color: 'white',
          borderRadius: '4px'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '8px',
            fontSize: '16px' 
          }}>
            Classification
          </div>
          <div>Aucun modèle chargé pour afficher la classification.</div>
        </div>
      );
    }

    // Si nous avons des modèles mais pas de classifications, afficher un message d'attente
    if (!hasClassifications && !currentHasClassifications) {
      return (
        <div style={{ 
          padding: '16px', 
          margin: '8px', 
          backgroundColor: '#616161', 
          color: 'white',
          borderRadius: '4px'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '8px',
            fontSize: '16px' 
          }}>
          </div>
          <div>Chargement des classifications...</div>
        </div>
      );
    }

    // Si tout est bon, rendre le conteneur pour l'arbre
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
  }, [components, classifications, updateKey, hasModels, hasClassifications]);

  return {
    ClassificationTreeComponent,
    updateClassificationData
  };
};