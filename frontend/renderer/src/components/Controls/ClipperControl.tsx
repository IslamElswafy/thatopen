import { FC, useEffect } from 'react';
import { Components, World } from '@thatopen/components';
import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import { Color } from 'three';

interface ClipperControlProps {
  components: Components;
  world: World;
  container: HTMLElement;
}

export const ClipperControl: FC<ClipperControlProps> = ({ 
  components, 
  world, 
  container 
}) => {
  useEffect(() => {
    if (!components || !world || !container) return;

    const clipper = components.get(OBC.Clipper);
    if (!clipper) return;

    // Vérification si le clipper est déjà configuré
    if (!clipper.isSetup) {
      // Configuration initiale via l'interface Configurable
      clipper.setup({
        enabled: true,
        visible: true,
        color: new Color("#202932"),
        opacity: 0.2,
        size: 5
      });
    }

    // Gestion des événements de création/suppression (interface Createable)
    const handleDoubleClick = () => {
      if (clipper.config.enabled) {
        clipper.create(world);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.code === "Delete" || event.code === "Backspace") && clipper.config.enabled) {
        clipper.delete(world);
      }
    };

    // Abonnement aux événements du clipper
    clipper.onSetup.add(() => {
      console.log('Clipper setup completed');
    });

    container.addEventListener("dblclick", handleDoubleClick);
    window.addEventListener("keydown", handleKeyDown);

    // Nettoyage (interface Disposable)
    return () => {
      container.removeEventListener("dblclick", handleDoubleClick);
      window.removeEventListener("keydown", handleKeyDown);
      clipper.dispose();
    };
  }, [components, world, container]);

  // Template UI avec les contrôles de configuration
  return (
    <div dangerouslySetInnerHTML={{ 
      __html: BUI.html`
        <div style="padding: 12px;">
          <bim-label>Double clic: Créer un plan de coupe</bim-label>
          <bim-label>Touche Delete: Supprimer un plan</bim-label>
          
          <bim-checkbox 
            label="Clipper enabled" 
            checked 
            @change="${(e: any) => {
              const clipper = components.get(OBC.Clipper);
              if (clipper && clipper.isSetup) {
                clipper.config.enabled = e.target.checked;
              }
            }}"
          ></bim-checkbox>
          
          <bim-checkbox 
            label="Clipper visible" 
            checked 
            @change="${(e: any) => {
              const clipper = components.get(OBC.Clipper);
              if (clipper && clipper.isSetup) {
                clipper.config.visible = e.target.checked;
              }
            }}"
          ></bim-checkbox>
          
          <bim-color-input 
            label="Couleur du plan" 
            color="#202932"
            @input="${(e: any) => {
              const clipper = components.get(OBC.Clipper);
              if (clipper && clipper.isSetup) {
                clipper.config.color = new Color(e.target.color);
              }
            }}"
          ></bim-color-input>
          
          <bim-number-input 
            slider 
            step="0.01" 
            label="Opacité" 
            value="0.2" 
            min="0.1" 
            max="1"
            @change="${(e: any) => {
              const clipper = components.get(OBC.Clipper);
              if (clipper && clipper.isSetup) {
                clipper.config.opacity = e.target.value;
              }
            }}"
          ></bim-number-input>
          
          <bim-number-input 
            slider 
            step="0.1" 
            label="Taille" 
            value="5" 
            min="2" 
            max="10"
            @change="${(e: any) => {
              const clipper = components.get(OBC.Clipper);
              if (clipper && clipper.isSetup) {
                clipper.config.size = e.target.value;
              }
            }}"
          ></bim-number-input>
        </div>
      `.toString()
    }} />
  );
};