import * as THREE from "three";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";

/**
 * Attache les écouteurs d'événements pour le double clic et la suppression via le clavier.
 *
 * @param clipper - Le composant clipper
 * @param world - Le world de votre scène
 * @param container - L'élément sur lequel écouter les événements
 */
function attachEventListeners(clipper: any, world: any, container: HTMLElement): void {
    // Gestion du double clic sur le conteneur
    container.addEventListener("dblclick", () => {
        if (clipper.enabled) {
            clipper.create(world);
            console.log("Plan de coupe créé via double clic.");
        }
    });

    // Gestion de la suppression via Delete ou Backspace
    window.addEventListener("keydown", (event: KeyboardEvent) => {
        if ((event.code === "Delete" || event.code === "Backspace") && clipper.enabled) {
            clipper.delete(world);
            console.log("Plan de coupe supprimé.");
        }
    });
}

/**
 * Crée et configure le clipper permettant de générer des plans de coupe.
 *
 * @param components - L'instance Components
 * @param world - Le world contenant scene, renderer et camera
 * @param container - L'élément DOM sur lequel le clipper doit être actif
 * @returns Un élément UI à intégrer dans votre interface
 */
export function createClipper(
    components: any,
    world: any,
    container: HTMLElement,
): HTMLElement {
    // Option de débogage pour rendre container accessible globalement (à retirer en prod)
    (window as any).container = container;

    // Récupérer le composant Clipper et le configurer
    const clipper = components.get(OBC.Clipper);
    clipper.enabled = true;
    clipper.config = {
        enabled: true,
        visible: true,
        color: new THREE.Color("#202932"),
        opacity: 0.2,
        size: 5,
    };

    if (!container) {
        console.warn("Container invalide ou non défini");
        return document.createElement("div");
    }

    // Attacher les écouteurs d'événements dans une fonction dédiée
    attachEventListeners(clipper, world, container);

    // Création de l'interface utilisateur pour le contrôle du clipper
    const ui = BUI.Component.create(() => {
        return BUI.html`
      <div style="padding: 12px;">
        <bim-label>Double clic: Créer un plan de coupe</bim-label>
        <bim-label>Touche Delete: Supprimer un plan</bim-label>
        <bim-checkbox label="Clipper enabled" checked 
          @change="${({ target }: { target: BUI.Checkbox }) => {
                clipper.config.enabled = target.value;
            }}">
        </bim-checkbox>
        <bim-checkbox label="Clipper visible" checked 
          @change="${({ target }: { target: BUI.Checkbox }) => {
                clipper.config.visible = target.value;
            }}">
        </bim-checkbox>
        <bim-color-input label="Couleur du plan" color="#202932" 
          @input="${({ target }: { target: BUI.ColorInput }) => {
                clipper.config.color = new THREE.Color(target.color);
            }}">
        </bim-color-input>
        <bim-number-input slider step="0.01" label="Opacité" value="0.2" min="0.1" max="1"
          @change="${({ target }: { target: BUI.NumberInput }) => {
                clipper.config.opacity = target.value;
            }}">
        </bim-number-input>
        <bim-number-input slider step="0.1" label="Taille" value="5" min="2" max="10"
          @change="${({ target }: { target: BUI.NumberInput }) => {
                clipper.config.size = target.value;
            }}">
        </bim-number-input>
        <bim-button label="Supprimer tous" 
          @click="${() => {
                clipper.deleteAll();
            }}">
        </bim-button>
      </div>
    `;
    });

    return ui;
}