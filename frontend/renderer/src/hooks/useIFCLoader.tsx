import { useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as THREE from 'three';
import { updateRaycasterTargets } from '../services/raycaster';

export const useIFCLoader = (
  components: OBC.Components | null,
  world: OBC.World | null,
  setIsLoading: (loading: boolean) => void
) => {
  const [isImporting, setIsImporting] = useState(false);

  const loadIFC = useCallback(async (file: File) => {
    if (!components || !world) return;

    setIsLoading(true);
    try {
      const ifcLoader = components.get(OBC.IfcLoader);
      ifcLoader.settings.wasm = {
        path: "/wasm/",
        absolute: true
      };
      if (!ifcLoader) throw new Error('IFC Loader non trouvé');

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      // Chargement et ajout du modèle à la scène
      const model = await ifcLoader.load(buffer);
      model.name = 'example';
      world.scene.three.add(model);
      
      // Mise à jour des cibles du raycaster
      updateRaycasterTargets(components, world);

      // Écoute de l'événement de chargement des fragments
      const fragments = components.get(OBC.FragmentsManager);
      fragments?.onFragmentsLoaded.add((fragModel: THREE.Object3D) => {
        console.log('Fragments chargés :', fragModel);
      });

      return model;
    } catch (error) {
      console.error('Erreur lors du chargement IFC:', error);
    } finally {
      setIsLoading(false);
      setIsImporting(false);
    }
  }, [components, world, setIsLoading]);

  return { loadIFC, isImporting };
};