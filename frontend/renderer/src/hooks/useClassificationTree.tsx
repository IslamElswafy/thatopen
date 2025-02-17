import { useEffect, useState } from 'react';
import { Components } from '@thatopen/components';
import * as CUI from '@thatopen/ui-obc';

export const useClassificationTree = (components: Components) => {
  const [treeElement, setTreeElement] = useState<HTMLElement | null>(null);
  const [classifications, setClassifications] = useState<any[]>([]);

  useEffect(() => {
    const { treeElement: tree } = CUI.tables.classificationTree({
      components,
      classifications: [],
    });

    setTreeElement(tree);

    // Écouteur pour les mises à jour de classification
    const handleClassificationUpdate = (updatedClassifications: any[]) => {
      setClassifications(updatedClassifications);
    };

    // Nettoyage
    return () => {
      // Supprimer les écouteurs si nécessaire
    };
  }, [components]);

  return { treeElement, classifications };
};