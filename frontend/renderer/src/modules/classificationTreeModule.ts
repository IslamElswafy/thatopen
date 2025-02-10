import * as CUI from "@thatopen/ui-obc";

export function createClassificationTree(components: any): {
    treeElement: HTMLElement;
    update: (data: any) => void;
} {
    const [treeElement, update] = CUI.tables.classificationTree({
        components,
        classifications: [],
    });
    return { treeElement, update };
}