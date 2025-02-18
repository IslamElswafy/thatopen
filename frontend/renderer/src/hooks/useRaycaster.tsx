import { useEffect, useRef } from "react";
import * as OBC from "@thatopen/components";
import { Components } from "@thatopen/components";
import * as THREE from "three";
import { updateRaycasterTargets } from "../services/raycaster";

export interface UseRaycasterProps {
  components: Components | null;
  world: OBC.World | null;
}
const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
const hoverMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });

export const useRaycaster = ({
  components,
  world,
}: UseRaycasterProps) => {
  // Stocker le mesh précédemment survolé
  const previousSelection = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!components || !world || !defaultMaterial || !hoverMaterial) return;

    // Mise à jour initiale des cibles
    updateRaycasterTargets(components, world);
    const casters = components.get(OBC.Raycasters);
    const caster = casters.get(world) as any;

    window.onmousemove = () => {
      // Reconstruit les cibles à chaque mouvement
      updateRaycasterTargets(components, world);

      // Si un mesh était survolé, on restaure son matériau d'origine
      if (previousSelection.current) {
        const prev = previousSelection.current;
        if (prev.userData.originalMaterial) {
          if (Array.isArray(prev.userData.originalMaterial)) {
            prev.material = prev.userData.originalMaterial.map((mat: THREE.Material) => mat.clone());
          } else {
            prev.material = prev.userData.originalMaterial.clone();
          }
          delete prev.userData.originalMaterial;
        } else {
          prev.material = defaultMaterial.clone();
        }
        previousSelection.current = null;
      }

      const result = caster.castRay(caster.targets);
      if (!result || !(result.object instanceof THREE.Mesh)) return;

      const selectedMesh = result.object as THREE.Mesh;
      // Sauvegarde le matériau d'origine en clonant
      if (!selectedMesh.userData.originalMaterial) {
        if (Array.isArray(selectedMesh.material)) {
          selectedMesh.userData.originalMaterial = selectedMesh.material.map((mat: THREE.Material) => mat.clone());
        } else if (selectedMesh.material && typeof selectedMesh.material.clone === "function") {
          selectedMesh.userData.originalMaterial = selectedMesh.material.clone();
        }
      }
      // Applique le hoverMaterial en clonant
      if (Array.isArray(selectedMesh.material)) {
        selectedMesh.material = selectedMesh.material.map(() => hoverMaterial.clone());
      } else {
        selectedMesh.material = hoverMaterial.clone();
      }

      previousSelection.current = selectedMesh;
    };

    return () => {
      window.onmousemove = null;
    };
  }, [components, world]);

  return {
    updateTargets: () => {
      if (components && world) {
        updateRaycasterTargets(components, world);
      }
    }
  };
};