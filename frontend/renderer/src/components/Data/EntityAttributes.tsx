import { FC, useEffect, useRef, useState } from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import * as BUI from '@thatopen/ui';
import * as CUI from '@thatopen/ui-obc';
import * as OBC from '@thatopen/components';
import * as OBF from "@thatopen/components-front";

interface EntityAttributesPanelProps {
  components: OBC.Components | null;
  world: OBC.World | null;
  model: any;
}

export const EntityAttributes: FC<EntityAttributesPanelProps> = ({ components, world, model }) => {
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  
  // Références pour les gestionnaires
  const indexerRef = useRef<any>(null);
  const highlighterRef = useRef<any>(null);
  const updateTableRef = useRef<((options: any) => void) | null>(null);
  const modelRef = useRef<any>(null);

  // Effet de nettoyage
  useEffect(() => {
    return () => {
      try {
        if (highlighterRef.current?.events?.select) {
          if (highlighterRef.current.events.select.onHighlight) {
            highlighterRef.current.events.select.onHighlight.clear();
          }
          if (highlighterRef.current.events.select.onClear) {
            highlighterRef.current.events.select.onClear.clear();
          }
        }
        if (panelContainerRef.current) {
          panelContainerRef.current.innerHTML = '';
        }
      } catch (e) {
        console.warn("EntityAttributes: Erreur lors du nettoyage:", e);
      }
    };
  }, []);

  // Effet principal d'initialisation
  useEffect(() => {
    if (!components || !world || !model) {
      console.log("EntityAttributes: Dépendances manquantes");
      return;
    }

    // Éviter la réinitialisation si même modèle
    if (modelRef.current === model && initialized) {
      console.log("EntityAttributes: Modèle déjà initialisé");
      return;
    }

    const initializePanel = async () => {
      try {
        setLoading(true);
        setError(null);
        modelRef.current = model;

        console.log("EntityAttributes: Initialisation...");

        // Obtenir les composants nécessaires
        const fragmentManager = components.get(OBC.FragmentsManager);
        const indexer = components.get(OBC.IfcRelationsIndexer);

        if (!fragmentManager || !indexer) {
          throw new Error("Composants requis non disponibles");
        }

        // Indexer le modèle
        console.log("EntityAttributes: Indexation des propriétés...");
        await indexer.process(model);
        indexerRef.current = indexer;

        // Créer la table d'attributs avec définition complète
        const [table, updateTable] = CUI.tables.entityAttributes({
          components,
          fragmentIdMap: {},
          tableDefinition: {},
          attributesToInclude: () => ["Name", "Description", "ContainedInStructure"],
        });

        // Configurer la table
        table.expanded = true;
        table.indentationInText = true;
        table.preserveStructureOnFilter = true;
        updateTableRef.current = updateTable;

        // Configurer le gestionnaire de fragments
        fragmentManager.onFragmentsLoaded.add((group: any) => {
          if (!updateTableRef.current) return;
          console.log("EntityAttributes: Fragments chargés", group);
        });

        // Configurer le highlighter pour la sélection
        const highlighter = components.get(OBF.Highlighter);
        if (highlighter) {
          highlighterRef.current = highlighter;
          highlighter.setup({ world });

          // Configurer la sélection multiple
          highlighter.multiple = "shiftKey";

          // Écouter la sélection
          highlighter.events.select.onHighlight.add((fragmentIdMap: Record<string, Set<number>>) => {
            if (!updateTableRef.current) return;
            console.log("EntityAttributes: Sélection mise à jour", fragmentIdMap);
            updateTableRef.current({ fragmentIdMap });
          });

          // Écouter la désélection
          highlighter.events.select.onClear.add(() => {
            if (!updateTableRef.current) return;
            console.log("EntityAttributes: Sélection effacée");
            updateTableRef.current({ fragmentIdMap: {} });
          });
        }

        // Écouter la suppression des fragments
        fragmentManager.onFragmentsDisposed.add((event: { groupID: string, fragmentIDs: string[] }) => {
          if (!updateTableRef.current) return;
          console.log("EntityAttributes: Fragments supprimés", event);
          updateTableRef.current({ fragmentIdMap: {} });
        });

        // Créer et injecter le panneau
        if (panelContainerRef.current) {
          const panel = BUI.Component.create(() => {
            return BUI.html`
              <div class="entities-attributes-panel" 
                   style="max-height: 400px; overflow-y: auto; color: #333333;">
                ${table}
              </div>`;
          });

          panelContainerRef.current.innerHTML = '';
          panelContainerRef.current.appendChild(panel);
        }

        setInitialized(true);
        console.log("EntityAttributes: Initialisation terminée");

      } catch (e) {
        console.error("EntityAttributes: Erreur:", e);
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    // Démarrer l'initialisation avec un léger délai
    const timer = setTimeout(initializePanel, 100);
    return () => clearTimeout(timer);

  }, [components, world, model]);

  return (
    <Paper sx={{ p: 2, backgroundColor: '#424242', color: 'white', height: '100%', overflowY: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Propriétés de l'entité
      </Typography>
      
      {!model && (
        <Typography variant="body2" sx={{ color: '#aaa', fontStyle: 'italic' }}>
          Aucun modèle chargé. Veuillez importer un modèle IFC.
        </Typography>
      )}
      
      {loading && (
        <Box display="flex" alignItems="center" my={2}>
          <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
          <Typography variant="body2">Chargement des attributs...</Typography>
        </Box>
      )}
      
      {error && (
        <Typography variant="body2" sx={{ color: '#ff7777', my: 2 }}>
          {error}
        </Typography>
      )}
      
      <div ref={panelContainerRef} style={{ minHeight: '50px' }} />
    </Paper>
  );
};