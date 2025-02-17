import { useCallback, useMemo } from 'react';
import { Components, World, Clipper } from '@thatopen/components';
import { Color } from 'three';

interface ClipperConfig {
  enabled?: boolean;
  visible?: boolean;
  color?: Color;
  opacity?: number;
  size?: number;
}

export const useClipper = (
  components: Components,
  world: World,
  container: HTMLElement
) => {
  const clipper = useMemo(() => {
    const clipperComponent = components.get(Clipper);
    if (!clipperComponent) throw new Error('Clipper component not found');
    return clipperComponent;
  }, [components]);

  const createClipPlane = useCallback(() => {
    if (clipper.enabled) {
      clipper.create(world);
      console.log('Plan de coupe créé');
    }
  }, [clipper, world]);

  const deleteClipPlane = useCallback(() => {
    if (clipper.enabled) {
      clipper.delete(world);
      console.log('Plan de coupe supprimé');
    }
  }, [clipper, world]);

  const updateConfig = useCallback((newConfig: ClipperConfig) => {
    Object.assign(clipper.config, newConfig);
    // Si le composant possède une méthode refresh, on l'appelle
    if (typeof clipper.refresh === 'function') {
      clipper.refresh(world);
    }
  }, [clipper, world]);

  return {
    clipper,
    createClipPlane,
    deleteClipPlane,
    updateConfig,
  };
};