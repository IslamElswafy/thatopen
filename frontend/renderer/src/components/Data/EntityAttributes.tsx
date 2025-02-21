import { FC, useEffect, useRef, useState } from 'react';
import { Paper, Typography } from '@mui/material';
import * as BUI from '@thatopen/ui';
import * as OBC from '@thatopen/components';
import * as CUI from '@thatopen/ui-obc';
import * as OBF from '@thatopen/components-front';

interface EntityAttributesPanelProps {
  components: OBC.Components;
  world: OBC.World;
  model: any; // Ajout de la prop modèle
}

export const EntityAttributes: FC<EntityAttributesPanelProps> = ({ components, world, model }) => {
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const [panelElement, setPanelElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!components || !world) {
      console.log("EntityAttributes: components ou world manquant", { components, world });
      return;
    }

    if (!model) {
      console.log("EntityAttributes: Aucun modèle chargé");
      return;
    }

    console.log("EntityAttributes: components, world et model sont disponibles", { components, world, model });

    // 1. Indexer le modèle
    const indexer = components.get(OBC.IfcRelationsIndexer);
    (async () => {
      console.log("EntityAttributes: Début de l'indexation du modèle");
      await indexer.process(model);
      console.log("EntityAttributes: Modèle indexé");

      // 2. Définir une base de style
      const baseStyle: Record<string, string> = {
        padding: "0.25rem",
        borderRadius: "0.25rem",
      };

      // 3. Créer le tableDefinition, la table et configurer le highlighter...
      // (Code de création de la table d'attributs inchangé)
      
      // Exemple simplifié pour la suite :
      const [table, updateTable] = CUI.tables.entityAttributes({
        components,
        fragmentIdMap: {},
        tableDefinition: {}, // Votre définition de table ici
        attributesToInclude: () => ["Name", "ContainedInStructure"],
      });
      console.log("EntityAttributes: Table d'attributs créée", table);
      table.expanded = true;
      table.indentationInText = true;
      table.preserveStructureOnFilter = true;

      const highlighter = components.get(OBF.Highlighter);
      console.log("EntityAttributes: Configuration du highlighter", highlighter);
      highlighter.setup({ world });
      highlighter.events.select.onHighlight.add((fragmentIdMap: any) => {
        console.log("EntityAttributes: onHighlight event", fragmentIdMap);
        updateTable({ fragmentIdMap });
      });
      highlighter.events.select.onClear.add(() => {
        console.log("EntityAttributes: onClear event");
        updateTable({ fragmentIdMap: {} });
      });

      const entityAttributesPanel = BUI.Component.create(() => {
        console.log("EntityAttributes: Création du panneau d'attributs");
        // (Code de création du panneau inchangé)
        return BUI.html`<div>${table}</div>`;
      });

      console.log("EntityAttributes: Panneau d'attributs créé", entityAttributesPanel);
      setPanelElement(entityAttributesPanel);
    })();
  }, [components, world, model]);

  useEffect(() => {
    if (panelContainerRef.current && panelElement) {
      console.log("EntityAttributes: Injection du panneau dans le container", panelElement);
      panelContainerRef.current.innerHTML = "";
      panelContainerRef.current.appendChild(panelElement);
    }
  }, [panelElement]);

  return (
    <Paper sx={{ p: 2, m: 1 }}>
      <Typography variant="h6" gutterBottom>
        Entity Attributes
      </Typography>
      <div ref={panelContainerRef} />
    </Paper>
  );
};