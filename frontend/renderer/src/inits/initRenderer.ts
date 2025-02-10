import * as OBC from "@thatopen/components";

export function initRenderer(container: HTMLElement) {
    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create<
        OBC.SimpleScene,
        OBC.SimpleCamera,
        OBC.SimpleRenderer
    >();

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera = new OBC.SimpleCamera(components);

    // Création de la grille
    const viewerGrids = components.get(OBC.Grids);
    viewerGrids.create(world);

    components.init();

    world.scene.three.background = null;

    world.camera.controls.setLookAt(5, 5, 5, 0, 0, 0);

    world.scene.setup();

    container.style.position = "relative";

    return { components, world };
}