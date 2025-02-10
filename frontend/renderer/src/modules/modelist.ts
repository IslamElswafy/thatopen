import * as CUI from "@thatopen/ui-obc";

export function createModelist(components: any): HTMLElement {
    const [modelist] = CUI.tables.modelsList({
        components,
        tags: { schema: true, viewDefinition: false },
        actions: { download: false },
    });

    return modelist;
}