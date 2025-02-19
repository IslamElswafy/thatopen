import { useEffect, useState } from 'react';
import { Components } from '@thatopen/components';
import * as CUI from '@thatopen/ui-obc';
import * as OBC from '@thatopen/components';

interface Classification {
  system: string;
  label: string;
}

export const useClassificationTree = (components: Components | null) => {
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [treeElement, setTreeElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!components) return;
    const classifier = components.get(OBC.Classifier);
    const fragmentsManager = components.get(OBC.FragmentsManager);
    if (!classifier || !fragmentsManager) return;

    // Création initiale du tree via la méthode recommandée
    const [classificationsTree, updateClassificationsTree] = CUI.tables.classificationTree({
      components,
      classifications: [],
    });
    setTreeElement(classificationsTree);

    // Abonnement à l'événement de chargement des fragments
    const handleFragmentsLoaded = async (model: any) => {
      // Création de la classification "entities"
      classifier.byEntity(model);
      // Création de la classification "predefinedTypes"
      await classifier.byPredefinedType(model);

      // Définition des classifications à afficher
      const updatedClassifications = [
        { system: 'entities', label: 'Entities' },
        { system: 'predefinedTypes', label: 'Predefined Types' },
      ];

      // Mise à jour de l'état et de l'affichage du tree
      setClassifications(updatedClassifications);
      updateClassificationsTree({ classifications: updatedClassifications });
    };

    fragmentsManager.onFragmentsLoaded.add(handleFragmentsLoaded);
    return () => {
      fragmentsManager.onFragmentsLoaded.remove(handleFragmentsLoaded);
    };
  }, [components]);

  return { treeElement, classifications };
};