export function createSection(content: HTMLElement | HTMLElement[], label: string): HTMLElement {
    const section = document.createElement("bim-panel-section");
    section.setAttribute("label", label);
    if (Array.isArray(content)) {
      content.forEach(child => section.appendChild(child));
    } else {
      section.appendChild(content);
    }
    return section;
  }