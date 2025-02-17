import { useState, useEffect } from 'react';
import { Components } from '@thatopen/components';
import * as CUI from '@thatopen/ui-obc';

export const useModelList = (components: Components) => {
  const [modelListElement, setModelListElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const [modelist] = CUI.tables.modelsList({
      components,
      tags: { 
        schema: true, 
        viewDefinition: false 
      },
      actions: { 
        download: false 
      }
    });

    setModelListElement(modelist);

    return () => {
      // Nettoyage si nécessaire
      modelListElement?.remove();
    };
  }, [components]);

  return { modelListElement };
};