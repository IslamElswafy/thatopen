import * as OBC from "@thatopen/components";
import { createIfcLoadingDialog } from "../modals/ifcLoadingDialog";
import { updateRaycasterTargets } from "../modules/raycaster";

export function overrideIfcLoader(components: any, world: any) {
    const ifcLoader = components.get(OBC.IfcLoader);
    if (!ifcLoader) {
        console.warn("IfcLoader introuvable dans components.");
        return;
    }

    const originalLoad = ifcLoader.load.bind(ifcLoader);

    ifcLoader.load = async (...args: any[]) => {
        const loadingDialog = createIfcLoadingDialog();
        document.body.appendChild(loadingDialog);
        loadingDialog.showModal();

        try {
            const fragmentsGroup = await originalLoad(...args);
            if (!fragmentsGroup) {
                throw new Error("Aucun fragmentsGroup retourné par la méthode d'origine.");
            }
            console.log("[DEBUG] Ajout des fragments à la scène", fragmentsGroup);

            if (!fragmentsGroup.uuid) {
                throw new Error("Le group de fragments ne possède pas d'UUID.");
            }
            const fragmentsManager = components.get(OBC.FragmentsManager);
            if (fragmentsManager && fragmentsManager.groups) {
                fragmentsManager.groups.set(fragmentsGroup.uuid, fragmentsGroup);
            }

            world.scene.three.add(fragmentsGroup);
            updateRaycasterTargets(components, world);

            return fragmentsGroup;
        } catch (error) {
            console.error("Erreur lors du chargement IFC avec la modale :", error);
            throw error;
        } finally {
            loadingDialog.close();
            loadingDialog.remove();
        }
    };
}