import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";

export const initManagers = () => {
  BUI.Manager.init();
  CUI.Manager.init();
};


export const initRenderer = (container: HTMLElement) => {
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);
  const world = worlds.create<
    OBC.SimpleScene,
    OBC.SimpleCamera,
    OBC.SimpleRenderer
  >();

  // Configuration de la scène
  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, container);
  world.camera = new OBC.SimpleCamera(components);

  // Initialisation des composants
  components.init();

  // Configuration supplémentaire
  world.scene.three.background = null;
  
  const waitForUniforms = () => {
    const controls: any = world.camera.controls;
    // Si la propriété material n'existe pas, on la crée avec l'uniform uZoom
    if (!controls.material) {
      controls.material = {
        uniforms: {
          uZoom: { value: world.camera.three.zoom || 1 }
        }
      };
    }
    if (controls.material.uniforms.uZoom !== undefined) {
      controls.setLookAt(5, 5, 5, 0, 0, 0);
      world.scene.setup();
    } else {
      requestAnimationFrame(waitForUniforms);
    }
  };
  waitForUniforms();
  world.scene.setup();
  

  // Ajout de la grille
  const viewerGrids = components.get(OBC.Grids);
  viewerGrids.create(world);

  // Style du conteneur
  container.style.position = "relative";

  return { components, world };
};

export const disposeRenderer = (world: OBC.World) => {
  world.renderer?.dispose();
  world.scene?.dispose();
};