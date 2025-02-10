import * as CUI from "@thatopen/ui-obc";

export function createIfcImportation(components: any): HTMLElement {
    const [loadIfcBtn] = CUI.buttons.loadIfc({ components });
    return loadIfcBtn;
}