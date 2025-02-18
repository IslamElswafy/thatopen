import { FC, useEffect, useRef, useState, ChangeEvent } from 'react';
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import * as THREE from 'three';
import { useRaycaster } from '../../hooks/useRaycaster';
import { useRenderer } from '../../hooks/useRenderer';
import { useIFCLoader } from '../../hooks/useIFCLoader';
import { LoadingDialog } from '../UI/LoadingDialog';
import { SectionsAccordion, SectionItem } from '../UI/SectionsAccordion';
import { ClipperControl } from '../Controls/ClipperControl';
import { ClassificationTree } from '../Classification/ClassificationTree';
import { ModelList } from '../Panels/ModelList';

const IFCViewer: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [isLoading, setIsLoading] = useState(false);

  // Obtention des composants et du monde
  const { components, world, isInitialized } = useRenderer(containerRef);
  
  useEffect(() => {
    // Initialisation des managers BUI et CUI
    BUI.Manager.init();
    CUI.Manager.init();
  }, []);

  // Hook personnalisé pour le chargement IFC
  const { loadIFC } = useIFCLoader(components, world, setIsLoading);

  // Appel du hook pour activer le raycaster
  useRaycaster({
    components,
    world,
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

  const sections: SectionItem[] = [];
  if (components && world && containerRef.current) {
    sections.push({
      label: 'Classification',
      content: <ClassificationTree components={components} />,
    });
    sections.push({
      label: 'Modèles chargés',
      content: <ModelList components={components} />,
    });
    sections.push({
      label: 'Importation',
      content: (
        <input 
          type="file" 
          accept=".ifc" 
          onChange={handleFileChange} 
        />
      ),
    });
    sections.push({
      label: 'Plan de coupe',
      content: (
        <ClipperControl
          components={components}
          world={world}
          container={containerRef.current}
        />
      ),
    });
  }
  
  return (
    <div className="viewer-container">
      <div ref={containerRef} className="renderer-container" />
      {isInitialized && <SectionsAccordion sections={sections} />}
      {isLoading && <LoadingDialog />}
    </div>
  );
};

export default IFCViewer;