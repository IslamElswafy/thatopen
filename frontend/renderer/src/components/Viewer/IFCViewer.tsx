import { FC, useEffect, useRef, useState, ChangeEvent } from 'react';
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import * as THREE from 'three';
import { useRaycaster } from '../../hooks/useRaycaster';
import { useRenderer } from '../../hooks/useRenderer';
import { LoadingDialog } from '../UI/LoadingDialog';
import { useIFCLoader } from '../../hooks/useIFCLoader';
import { Section } from '../UI/createSection';
import { ClipperControl } from '../Controls/ClipperControl';
import { ClassificationTree } from '../Classification/ClassificationTree';
import { ModelList } from '../Panels/ModelList';

const IFCViewer: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [isLoading, setIsLoading] = useState(false);

  // Obtention des composants et du monde
  const { components, world, isInitialized } = useRenderer(containerRef);

  const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  const hoverMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });

  useEffect(() => {
    // Initialisation des managers BUI et CUI
    BUI.Manager.init();
    CUI.Manager.init();
  }, []);

  // Hook personnalisé pour le chargement IFC
  const { loadIFC } = useIFCLoader(components, world, setIsLoading);

  // Appel du hook pour activer le raycaster avec un effet "hover"
  useRaycaster({
    components,
    world,
    defaultMaterial,
    hoverMaterial,
  });

  // Gestion du changement de l'input file
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await loadIFC(file);
    } catch(error) {
      console.error("Erreur lors de l'import IFC :", error);
    }
  };

  // Création des sections (uniquement si components et world sont disponibles)
  const renderSections = () => {
    if (!components || !world || !containerRef.current) return null;

    return (
      <div className="sections-container">
        <Section label="Classification">
          <ClassificationTree components={components} />
        </Section>
        <Section label="Modèles chargés">
          <ModelList components={components} />
        </Section>
        <Section label="Importation">
          {/* Utilisation d'un input file pour lancer l'importation */}
          <input 
            type="file" 
            accept=".ifc" 
            onChange={handleFileChange} 
          />
        </Section>
        <Section label="Plan de coupe">
          <ClipperControl
            components={components}
            world={world}
            container={containerRef.current}
          />
        </Section>
      </div>
    );
  };

  return (
    <div className="viewer-container">
      <div ref={containerRef} className="renderer-container" />
      {isInitialized && renderSections()}
      {isLoading && <LoadingDialog />}
    </div>
  );
};

export default IFCViewer;