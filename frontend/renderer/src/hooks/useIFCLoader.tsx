import { useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as THREE from 'three';
import { updateRaycasterTargets } from '../services/raycaster';
import { safeExecute } from '../services/errorHandling';


export const useIFCLoader = (
  components: OBC.Components | null,
  world: OBC.World | null,
  setIsLoading: (loading: boolean) => void
) => {
  const [isImporting, setIsImporting] = useState(false);
  const [loadedModels, setLoadedModels] = useState<THREE.Object3D[]>([]);

  // Fonction de nettoyage des ressources d'un modèle
  const cleanupModel = useCallback((model: THREE.Object3D) => {
    if (!model) return;
    
    console.log(`Nettoyage du modèle ${model.name}...`);
    
    // Supprimer les écouteurs d'événements spécifiques au modèle
    if (model.userData.updateStreamerFunction && world?.camera?.controls) {
      world.camera.controls.removeEventListener('sleep', model.userData.updateStreamerFunction);
    }
    
    // Supprimer le modèle de la scène
    if (world) {
      world.scene.three.remove(model);
    }
    
    // Si le modèle a des enfants avec des matériaux, les disposer
    model.traverse((child: any) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: THREE.Material) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    // Mettre à jour les cibles du raycaster après suppression
    if (components && world) {
      updateRaycasterTargets(components, world);
    }
  }, [components, world]);

  // Supprimer un modèle spécifique
  const removeModel = useCallback((model: THREE.Object3D) => {
    if (!model) return;
    
    cleanupModel(model);
    setLoadedModels(prev => prev.filter(m => m !== model));
    
    // Forcer une mise à jour des composants qui dépendent des modèles
    if (components) {
      const fragments = components.get(OBC.FragmentsManager);
      if (fragments && fragments.onFragmentsDisposed) {
        fragments.onFragmentsDisposed.trigger({ groupID: model.uuid, fragmentIDs: [] });
      }
    }
    
    console.log(`Modèle ${model.name} supprimé`);
  }, [components, cleanupModel]);

  // Supprimer tous les modèles
  const removeAllModels = useCallback(() => {
    loadedModels.forEach(cleanupModel);
    setLoadedModels([]);
    
    console.log('Tous les modèles ont été supprimés');
  }, [loadedModels, cleanupModel]);

  const loadIFC = useCallback(async (file: File) => {
    if (!components || !world) return null;

    setIsLoading(true);
    setIsImporting(true);
    
    return await safeExecute(
      async () => {
        const ifcLoader = components.get(OBC.IfcLoader);
        if (!ifcLoader) throw new Error('IFC Loader non trouvé');

        ifcLoader.settings.wasm = {
          path: "/wasm/",
          absolute: true
        };

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        
        // Chargement et ajout du modèle à la scène
        const model = await ifcLoader.load(buffer);
        model.name = file.name.replace('.ifc', '') || 'example';
        world.scene.three.add(model);
        
        // Mise à jour des cibles du raycaster
        updateRaycasterTargets(components, world);

        // Écoute de l'événement de chargement des fragments
        const fragments = components.get(OBC.FragmentsManager);
        const onFragmentsLoadedHandler = (fragModel: THREE.Object3D) => {
          if (fragModel.uuid === model.uuid) {
            console.log('Fragments chargés pour le modèle:', fragModel.name);
          }
        };
        
        fragments?.onFragmentsLoaded.add(onFragmentsLoadedHandler);
        
        // Stocker la référence à l'écouteur pour le nettoyage
        model.userData.fragmentsLoadedHandler = onFragmentsLoadedHandler;
        
        // Ajouter le modèle à la liste des modèles chargés
        setLoadedModels(prev => [...prev, model]);
        
        return model;
      },
      'chargement du fichier IFC',
      () => {
        setIsLoading(false);
        setIsImporting(false);
      }
    );
  }, [components, world, setIsLoading]);
  
  return { 
    loadIFC, 
    removeModel, 
    removeAllModels, 
    loadedModels, 
    isImporting 
  };
};