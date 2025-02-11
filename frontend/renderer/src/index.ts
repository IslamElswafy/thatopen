import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import * as OBC from "@thatopen/components";
import { initRenderer } from "./inits/initRenderer";
import { createExtendedUIPanel } from "./panels/extendedUIPanel";
import { createSection } from "./panels/createSection";
import { createModelist } from "./modules/modelist";
import { createClassificationTree } from "./modules/classificationTreeModule";
import { createIfcImportation } from "./modules/ifcImportation";
import { overrideIfcLoader } from "./overrides/ifcLoader";
import { createClipper } from "./modules/clipper";
import { initializeRaycasterHover } from "./modules/raycaster";


BUI.Manager.init();
CUI.Manager.init();

// Récupération du conteneur de rendu
const container = document.getElementById("renderer-container")!;
const { components, world } = initRenderer(container);
initializeRaycasterHover(components, world);

(async () => {
  const ifcLoader = components.get(OBC.IfcLoader);
  await ifcLoader.setup();
  overrideIfcLoader(components, world);

  // Initialise le survol avec raycaster sur la scène (pour colorer au survol des IFC importés)

  // Construction de l'UI
  // Création de chaque module, enveloppés dans une section avec libellé 

  // Module Classification
  const { treeElement: classificationContent } = createClassificationTree(components);
  const classificationSection = createSection(classificationContent, "Classification");

  // Module Modelist
  const modelist = createModelist(components);
  const modelistSection = createSection(modelist, "Loaded Models");

  // Module Importation IFC
  const ifcImportationContent = createIfcImportation(components);
  const ifcSelectionSection = createSection(ifcImportationContent, "Importing");

  // Module Clipper
  const clipperContent = createClipper(components, world, container);
  const clipperSection = createSection(clipperContent, "Clipping");

  // Création du panel conteneur des sections
  const panel = createExtendedUIPanel(ifcSelectionSection, classificationSection, modelistSection, clipperSection);
  container.appendChild(panel);

})();