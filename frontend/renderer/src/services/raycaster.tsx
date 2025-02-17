import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { FragmentsGroup } from "@thatopen/fragments";

export const updateRaycasterTargets = (components: OBC.Components, world: OBC.World): void => {
  const casters = components.get(OBC.Raycasters);
  const caster = casters.get(world);
  const fragmentManager = components.get(OBC.FragmentsManager);

  const targets: THREE.Mesh[] = [];
  
  if (fragmentManager?.groups) {
    fragmentManager.groups.forEach((group: FragmentsGroup) => {
      if (group.parent === world.scene.three) {
        group.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            targets.push(child);
          }
        });
      }
    });
  }
  
  const result = caster.castRay(targets);
  if (result && result.object instanceof THREE.Mesh) {
    world.meshes.add(result.object);
  }
};

export const initializeRaycasterHover = (
  components: OBC.Components,
  world: OBC.World,
  _defaultMat?: THREE.Material,
  hoverMat?: THREE.Material
): () => void => {
  // Matériau pour le survol
  const hoverMaterial = hoverMat || new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5
  });

  // Récupération du raycaster
  const casters = components.get(OBC.Raycasters);
  const caster = casters.get(world);

  // État précédent
  let previousSelection: THREE.Mesh | null = null;
  let originalMaterial: THREE.Material | null = null;

  const handleMouseMove = () => {
    // Restaurer le matériau précédent
    if (previousSelection && originalMaterial) {
      previousSelection.material = originalMaterial;
      previousSelection = null;
      originalMaterial = null;
    }

    // Obtenir les cibles actuelles
    const fragmentManager = components.get(OBC.FragmentsManager);
    const targets: THREE.Mesh[] = [];
    
    if (fragmentManager?.groups) {
      fragmentManager.groups.forEach((group: FragmentsGroup) => {
        if (group.parent === world.scene.three) {
          group.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              targets.push(child);
            }
          });
        }
      });
    }

    // Lancer le rayon
    const result = caster.castRay(targets);
    if (!result || !(result.object instanceof THREE.Mesh)) {
      return;
    }

    // Mettre à jour la sélection
    const selectedMesh = result.object;
    originalMaterial = selectedMesh.material;
    selectedMesh.material = hoverMaterial;
    previousSelection = selectedMesh;
  };

  // Attacher l'écouteur d'événements
  window.addEventListener('mousemove', handleMouseMove);
  
  // Retourner la fonction de nettoyage
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    if (previousSelection && originalMaterial) {
      previousSelection.material = originalMaterial;
    }
  };
};