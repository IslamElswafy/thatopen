import { FC, useEffect, useRef, useState } from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import * as BUI from '@thatopen/ui';
import * as OBC from '@thatopen/components';
import * as CUI from '@thatopen/ui-obc';
import * as OBF from '@thatopen/components-front';

interface EntityAttributesPanelProps {
  components: OBC.Components;
  world: OBC.World;
  model: any; // Modèle IFC chargé
}

export const EntityAttributes: FC<EntityAttributesPanelProps> = ({ components, world, model }) => {
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const [panelElement, setPanelElement] = useState<HTMLElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!components || !world || !model) {
      if (!model) {
        console.log("EntityAttributes: Aucun modèle chargé");
      }
      return;
    }

    setLoading(true);
    setError(null);

    // Fonction asynchrone pour traiter le modèle
    const processModel = async () => {
      try {
        console.log("EntityAttributes: Début de l'indexation du modèle");
        
        // Vérifier si le modèle est un modèle de fragments (streamed ou standard)
        const isFragmentGroup = model.type === 'Group' || (model.userData && model.userData.type === 'FragmentsGroup');
        
        // Obtenir l'indexer
        const indexer = components.get(OBC.IfcRelationsIndexer);
        
        if (isFragmentGroup) {
          console.log("EntityAttributes: Modèle reconnu comme FragmentsGroup");
          
          // Pour les modèles streamés, nous devons vérifier si les propriétés sont disponibles
          if (!model.properties) {
            // Si les propriétés ne sont pas disponibles, essayons de les charger via le streamer
            const streamer = components.get(OBF.IfcStreamer);
            if (streamer) {
              console.log("EntityAttributes: Tentative de chargement des propriétés via streamer");
              try {
                // Tentative de chargement des propriétés via streamer si possible
                if (typeof streamer.loadProperties === 'function') {
                  await streamer.loadProperties(model);
                }
              } catch (streamError) {
                console.warn("EntityAttributes: Impossible de charger les propriétés via streamer:", streamError);
              }
            }
          }
          
          // Pour les modèles streamés, nous pouvons ignorer l'indexation car elle n'est pas toujours nécessaire
          console.log("EntityAttributes: Utilisation des données streamées directement");
        } else {
          // Pour les modèles standards, procéder à l'indexation
          console.log("EntityAttributes: Indexation du modèle standard");
          await indexer.process(model);
        }
        
        // Créer la table d'attributs
        const baseStyle: Record<string, string> = {
          padding: "0.25rem",
          borderRadius: "0.25rem",
        };
        
        // Création de la table d'attributs avec une approche adaptative
        const fragmentIdMap = model.properties ? { [model.uuid]: model } : {};
        
        const [table, updateTable] = CUI.tables.entityAttributes({
          components,
          fragmentIdMap,
          tableDefinition: {
            headers: {
              style: {
                ...baseStyle,
                backgroundColor: "#616161",
                color: "white",
                fontWeight: "bold",
              },
            },
            rows: {
              style: {
                ...baseStyle,
                backgroundColor: "#424242",
                color: "white",
              },
            },
          },
          attributesToInclude: () => ["Name", "Description", "ObjectType", "Tag", "PredefinedType"],
        });
        
        console.log("EntityAttributes: Table d'attributs créée");
        table.expanded = true;
        table.indentationInText = true;
        table.preserveStructureOnFilter = true;
        
        // Configuration du highlighter
        const highlighter = components.get(OBF.Highlighter);
        highlighter.setup({ world });
        
        const onHighlightHandler = (newFragmentIdMap: any) => {
          console.log("EntityAttributes: onHighlight event", newFragmentIdMap);
          updateTable({ fragmentIdMap: newFragmentIdMap });
        };
        
        const onClearHandler = () => {
          console.log("EntityAttributes: onClear event");
          updateTable({ fragmentIdMap: {} });
        };
        
        highlighter.events.select.onHighlight.add(onHighlightHandler);
        highlighter.events.select.onClear.add(onClearHandler);
        
        // Création du composant UI
        const entityAttributesPanel = BUI.Component.create(() => {
          return BUI.html`<div>${table}</div>`;
        });
        
        console.log("EntityAttributes: Panneau d'attributs créé");
        setPanelElement(entityAttributesPanel);
        setLoading(false);
        
        return () => {
          // Nettoyage des écouteurs d'événements
          highlighter.events.select.onHighlight.remove(onHighlightHandler);
          highlighter.events.select.onClear.remove(onClearHandler);
        };
      } catch (err) {
        console.error("EntityAttributes: Erreur lors de l'initialisation:", err);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        setLoading(false);
      }
    };
    
    processModel();
  }, [components, world, model]);

  useEffect(() => {
    if (panelContainerRef.current && panelElement) {
      console.log("EntityAttributes: Injection du panneau dans le container");
      panelContainerRef.current.innerHTML = "";
      panelContainerRef.current.appendChild(panelElement);
    }
  }, [panelElement]);

  return (
    <Paper sx={{ p: 2, m: 1, backgroundColor: '#616161', color: 'white' }}>
      <Typography variant="h6" gutterBottom>
        Entity Attributes
      </Typography>
      
      {!model && (
        <Typography variant="body2" sx={{ color: '#aaa', fontStyle: 'italic' }}>
          Aucun modèle chargé. Veuillez importer un modèle IFC.
        </Typography>
      )}
      
      {loading && model && (
        <Box display="flex" alignItems="center" my={2}>
          <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
          <Typography variant="body2">Chargement des attributs...</Typography>
        </Box>
      )}
      
      {error && (
        <Typography variant="body2" sx={{ color: '#ff7777' }}>
          Erreur: {error}
        </Typography>
      )}
      
      <div ref={panelContainerRef} />
    </Paper>
  );
};