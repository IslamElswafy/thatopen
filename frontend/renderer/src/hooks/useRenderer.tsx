import { useEffect, useState } from 'react';
import * as OBC from "@thatopen/components";
import { initRenderer, disposeRenderer, initManagers } from '../services/renderer';

interface RendererState {
  components: OBC.Components | null;
  world: OBC.World | null;
  isInitialized: boolean;
}

export const useRenderer = (containerRef: React.RefObject<HTMLElement>) => {
  const [state, setState] = useState<RendererState>({
    components: null,
    world: null,
    isInitialized: false
  });

  useEffect(() => {
    if (!containerRef.current) return;

    initManagers()

    const { components, world } = initRenderer(containerRef.current);
    setState({
      components,
      world,
      isInitialized: true
    });

    return () => {
      if (world) {
        disposeRenderer(world);
      }
    };
  }, [containerRef]);

  return state;
};