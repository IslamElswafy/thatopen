import { FC, useEffect, useRef, useState, ChangeEvent, Fragment } from 'react';
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import { useRaycaster } from '../../hooks/useRaycaster';
import { useRenderer } from '../../hooks/useRenderer';
import { useIFCLoader } from '../../hooks/useIFCLoader';
import { useClassificationTree } from '../../hooks/useClassificationTree';
import { SectionsAccordion, SectionItem } from '../UI/SectionsAccordion';
import { LoadingDialog } from '../UI/LoadingDialog';
import { ClipperControl } from '../Controls/ClipperControl';
import { ModelList } from '../Panels/ModelList';

const IFCViewer: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null!);
  const classificationContainerRef = useRef<HTMLDivElement>(null);
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

  // Hook personnalisé pour la création de l'arbre de classification
  const { treeElement } = useClassificationTree(components);

  // Appel du hook pour activer le raycaster
  useRaycaster({
    components,
    world,
  });

  useEffect(() => {
    if (treeElement && classificationContainerRef.current && !classificationContainerRef.current.contains(treeElement)) {
      classificationContainerRef.current.appendChild(treeElement);
    }
  }, [treeElement]);


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
      label: 'Classification',
      content: (
        <div ref={classificationContainerRef} />
      ),
    });
    sections.push({
      label: 'Modèles chargés',
      content: <ModelList components={components} />,
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
      <Fragment>
        <div ref={containerRef} className="app-container" style={{ position: 'relative' }}>
          {isInitialized && (
            <div style={{ position: 'absolute', 
            top: 10, 
            right: 10, 
            zIndex: 1000, 
            maxHeight: '95vh', 
            overflowY: 'auto' }}>
              <SectionsAccordion sections={sections} />
            </div>
          )}
        </div>
        {isLoading && <LoadingDialog />}
      </Fragment>
  );
};

export default IFCViewer;