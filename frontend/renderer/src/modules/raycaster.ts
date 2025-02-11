import * as THREE from "three";
import * as OBC from "@thatopen/components";

export function updateRaycasterTargets(components: any, world: any): void {
    const casters = components.get(OBC.Raycasters);
    const caster = casters.get(world);
    const fragmentManager = components.get(OBC.FragmentsManager);

    const targets: THREE.Object3D[] = [];


    if (fragmentManager && fragmentManager.groups) {
        fragmentManager.groups.forEach(group => {
            if (group.parent === world.scene.three) {
                group.traverse((child: THREE.Object3D) => {
                    if (child instanceof THREE.Mesh) {
                        targets.push(child);
                    }
                });
            }
        });
    }


    caster.targets = targets;
}

export function initializeRaycasterHover(
    components: any,
    world: any,
    defaultMat?: THREE.Material,
    hoverMat?: THREE.Material
): void {
    const defaultMaterial = defaultMat || new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 1
    });

    const hoverMaterial = hoverMat || new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5
    });

    let previousGroup: THREE.Group | null = null;
    let originalMaterials = new Map();

    const casters = components.get(OBC.Raycasters);
    const caster = casters.get(world);

    window.onmousemove = (_event: MouseEvent) => {
        if (previousGroup) {
            previousGroup.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh && originalMaterials.has(child.uuid)) {
                    child.material = originalMaterials.get(child.uuid);
                }
            });
            originalMaterials.clear();
        }

        const result = caster.castRay(caster.targets);
        if (!result || !(result.object instanceof THREE.Mesh)) {
            previousGroup = null;
            return;
        }

        // On récupère uniquement le mesh sélectionné
        const selectedMesh = result.object;
        originalMaterials.set(selectedMesh.uuid, selectedMesh.material);
        selectedMesh.material = hoverMaterial;
        previousGroup = selectedMesh.parent;
    };
}