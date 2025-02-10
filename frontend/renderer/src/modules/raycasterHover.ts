import * as THREE from "three";
import * as OBC from "@thatopen/components";

/**
 * Met à jour la liste des cibles du raycaster en aplatissant les objets de la scène.
 * On récupère ainsi tous les Mesh contenus dans les groupes IFC.
 */
export function updateRaycasterTargets(components: any, world: any): void {
    const casters = components.get(OBC.Raycasters);
    const caster = casters.get(world);

    const targets: THREE.Object3D[] = [];
    // Parcourt la scène pour récupérer uniquement les Mesh
    world.scene.three.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
            targets.push(object);
        }
    });
    caster.targets = targets;
}

/**
 * Initialise le survol (hover) des objets du modèle IFC via le raycaster.
 * Change la couleur (matériau) du Mesh survolé.
 */
export function initializeRaycasterHover(
    components: any,
    world: any,
    defaultMat?: THREE.Material,
    hoverMat?: THREE.Material
): void {
    const defaultMaterial = (defaultMat as THREE.MeshBasicMaterial) || new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    const hoverMaterial = (hoverMat as THREE.MeshBasicMaterial) || new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    let previousSelection: THREE.Mesh | null = null;

    // Récupération du raycaster associé à world via OBC.Raycasters
    const casters = components.get(OBC.Raycasters);
    const caster = casters.get(world);

    // Abonnement à l'événement mousemove pour changer la couleur du Mesh survolé
    window.onmousemove = (_event: MouseEvent) => {
        // Ici, nous utilisons l'ensemble des enfants de la scène IFC comme cible
        const result = caster.castRay(caster.targets);

        // Réinitialise le matériau du précédent objet survolé
        if (previousSelection) {
            previousSelection.material = defaultMaterial;
        }

        // Si aucune intersection ou l'objet intersecté n'est pas un Mesh, on quitte
        if (!result || !(result.object instanceof THREE.Mesh)) {
            previousSelection = null;
            return;
        }

        // Applique le matériau de survol
        result.object.material = hoverMaterial;
        previousSelection = result.object;
    };
}
