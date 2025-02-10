export function createIfcLoadingDialog(): HTMLDialogElement {
  const dialog = document.createElement("dialog");
  dialog.id = "ifc-loading-dialog";
  dialog.style.position = "relative";
  dialog.style.transform = "translate(0%, 125%)";
  dialog.style.border = "none";
  dialog.innerHTML = `
    <div class="flex flex-col backdrop-blur-md w-[350px] p-4 font-sans"
         style="background-color: var(--bim-ui_gray-1); 
                border: 1px solid var(--bim-ui_main-base); 
                border-radius: 0.5rem;">
      <div class="flex justify-between items-center pb-2 border-b-2"
           style="border-color: var(--bim-ui_main-base);">
        <h3 id="title-ifc-loading-dialog" class="text-xl font-bold" 
            style="color: var(--bim-ui_gray-10);">
          Loading model
        </h3>
        <p id="description-ifc-loading-dialog" class="text-base" 
           style="color: var(--bim-ui_gray-10);"></p>
      </div>
      <div id="content-ifc-loading-dialog" class="p-4" 
           style="color: var(--bim-ui_gray-10);">
        <p>Loading please wait...</p>
      </div>
    </div>
  `;
  return dialog;
}