import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import * as THREE from "three";

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
  world.scene.three.background = new THREE.Color(0x1a1a1a);
  world.scene.setup();
  
  // Positionner la caméra
  world.camera.controls.setLookAt(5, 5, 5, 0, 0, 0);

  // Ajout de la grille
  const viewerGrids = components.get(OBC.Grids);
  viewerGrids.create(world);

  // Initialiser le streamer pour les gros fichiers IFC
  const streamer = components.get(OBCF.IfcStreamer);
  streamer.world = world;
  
  // S'assurer que le tiler est disponible
  const tiler = components.get(OBC.IfcGeometryTiler);
  if (tiler) {
    // Préconfiguration pour accélérer le chargement ultérieur
    tiler.settings.wasm = {
      path: "https://unpkg.com/web-ifc@0.0.66/",
      absolute: true
    };
    tiler.settings.minGeometrySize = 20;
    tiler.settings.minAssetsSize = 1000;
    console.log("IfcGeometryTiler configuré avec succès");
  }

  // Style du conteneur
  container.style.position = "relative";

  return { components, world };
};

export const disposeRenderer = (world: OBC.World) => {
  // Nettoyer les URL objets
  const revokeAllObjectURLs = () => {
    const objectURLs = performance.getEntriesByType('resource')
      .filter(resource => resource.name.startsWith('blob:'))
      .map(resource => resource.name);
    
    objectURLs.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Erreur lors de la révocation de URL:', url, " error:", e);
      }
    });
  };

  revokeAllObjectURLs();
  
  // Disposer les ressources ThreeJS
  world.renderer?.dispose();
  world.scene?.dispose();
};