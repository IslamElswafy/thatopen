export function createExtendedUIPanel(...sections: HTMLElement[]): HTMLElement {
    // Crée un container global pour le panneau <bim-panel>
    const panel = document.createElement("bim-panel");
    panel.setAttribute("label", "IFC Models");
    sections.forEach(section => panel.appendChild(section));

    panel.style.position = "absolute";
    panel.style.top = "10px";
    panel.style.right = "10px";
    panel.style.zIndex = "10";

    return panel;
}