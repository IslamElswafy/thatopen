import { FC, useEffect, useState, useRef } from 'react';
import * as OBC from '@thatopen/components';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { useStreamingService } from '../../services/streaming';

interface EntityAttributesProps {
  components: OBC.Components;
  world: OBC.World;
  model: any;
}

export const EntityAttributes: FC<EntityAttributesProps> = ({ components, world, model }) => {
  // États pour gérer l'interface utilisateur
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any>[]>([]);
  
  // Références pour gérer le cycle de vie et les nettoyages
  const isMounted = useRef(true);
  const highlighterListenerRef = useRef<any>(null);
  const processedModelRef = useRef<string | null>(null);
  const streamingService = useStreamingService(components, world);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cleanupEventListeners();
    };
  }, []);

  // Fonction de nettoyage des écouteurs
  const cleanupEventListeners = () => {
    if (highlighterListenerRef.current && components) {
      try {
        const highlighter = components.get(OBC.FragmentHighlighter);
        if (highlighter) {
          highlighter.events.off("selection-changed", highlighterListenerRef.current);
          highlighterListenerRef.current = null;
        }
      } catch (e) {
        console.warn("Erreur lors du nettoyage des écouteurs:", e);
      }
    }
  };

  // Effet pour traiter le modèle et configurer les écouteurs
  useEffect(() => {
    // Si pas de modèle ou si on a déjà traité ce modèle, ne rien faire
    if (!model || !components || processedModelRef.current === model.uuid) {
      return;
    }

    console.log("EntityAttributes: Début de l'indexation du modèle");
    setLoading(true);
    setError(null);
    setAttributes([]);
    setSelectedEntityName(null);

    // Nettoyer les écouteurs précédents
    cleanupEventListeners();

    const setupModelListeners = async () => {
      try {
        // Détecter si c'est un FragmentsGroup ou un modèle streamé
        const isFragmentGroup = model.type === 'Group' || (model.userData && model.userData.type === 'FragmentsGroup');
        console.log("EntityAttributes: Modèle reconnu comme", isFragmentGroup ? "FragmentsGroup" : "Standard");

        // Obtenir le gestionnaire de propriétés
        const propertiesManager = components.get(OBC.IfcPropertiesManager);
        const attributesManager = components.get(OBC.IfcAttributesManager);
        
        if (!propertiesManager || !attributesManager) {
          throw new Error("Gestionnaires de propriétés non disponibles");
        }

        // Si c'est un modèle streamé, charger les propriétés via le streamer
        if (isFragmentGroup && streamingService) {
          console.log("EntityAttributes: Tentative de chargement des propriétés via streamer");
          try {
            if (model.properties) {
              console.log("EntityAttributes: Utilisation des données streamées directement");
            } else {
              await streamingService.loadModelProperties(model);
            }
          } catch (e) {
            console.warn("Impossible de charger les propriétés via streamer:", e);
          }
        } else if (propertiesManager) {
          // Pour les modèles standards, procéder à l'indexation classique
          await propertiesManager.process(model);
        }

        // Configurer l'écouteur pour la sélection
        const onSelectionChanged = (selection: any[]) => {
          if (!isMounted.current) return;

          if (selection.length === 0) {
            setSelectedEntityName(null);
            setAttributes([]);
            return;
          }

          try {
            const fragment = selection[0].fragment;
            const entityId = selection[0].id;

            // Obtenir les attributs de l'entité sélectionnée
            if (attributesManager) {
              const entityData = attributesManager.getAttributes(fragment, entityId);
              
              // Formater les données pour l'affichage
              const formattedAttributes: Record<string, any>[] = [];
              
              // Ajouter les attributs principaux
              Object.entries(entityData).forEach(([key, value]) => {
                if (key !== 'psets') {
                  formattedAttributes.push({
                    key,
                    value: String(value),
                    isPset: false
                  });
                }
              });
              
              // Ajouter le nom de l'entité pour l'affichage
              let entityName = entityData.Name || entityData.GlobalId || `Entity #${entityId}`;
              setSelectedEntityName(entityName);
              
              // Ajouter les property sets s'ils existent
              if (entityData.psets) {
                Object.entries(entityData.psets).forEach(([psetName, psetData]) => {
                  Object.entries(psetData as Record<string, any>).forEach(([propKey, propValue]) => {
                    if (propKey !== 'name') {
                      formattedAttributes.push({
                        key: propKey,
                        value: String(propValue),
                        isPset: true,
                        psetName
                      });
                    }
                  });
                });
              }
              
              setAttributes(formattedAttributes);
            }
          } catch (e) {
            console.warn("Erreur lors de l'obtention des attributs:", e);
            setError("Impossible de charger les attributs de l'élément sélectionné");
          }
        };

        // Enregistrer l'écouteur pour la sélection
        const highlighter = components.get(OBC.FragmentHighlighter);
        if (highlighter) {
          highlighterListenerRef.current = onSelectionChanged;
          highlighter.events.on("selection-changed", onSelectionChanged);
        }

        // Mettre à jour l'état
        processedModelRef.current = model.uuid;
        setLoading(false);

      } catch (err) {
        console.error("Erreur lors de l'indexation du modèle:", err);
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : "Erreur inconnue");
          setLoading(false);
        }
      }
    };

    setupModelListeners();

    return () => {
      cleanupEventListeners();
    };
  }, [model, components, world, streamingService]);

  // Effet pour réinitialiser quand le modèle devient null
  useEffect(() => {
    if (!model && processedModelRef.current) {
      processedModelRef.current = null;
      setAttributes([]);
      setSelectedEntityName(null);
      cleanupEventListeners();
    }
  }, [model]);

  return (
    <Paper sx={{ p: 2, backgroundColor: '#424242', color: 'white' }}>
      <Typography variant="h6" gutterBottom>
        Propriétés de l'entité
      </Typography>

      {!model && (
        <Typography variant="body2" sx={{ color: '#aaa', fontStyle: 'italic' }}>
          Aucun modèle chargé. Veuillez importer un modèle IFC.
        </Typography>
      )}

      {model && !selectedEntityName && !loading && (
        <Typography variant="body2" sx={{ color: '#aaa', fontStyle: 'italic' }}>
          Sélectionnez un élément du modèle pour voir ses attributs.
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
          Erreur: {error}
        </Typography>
      )}

      {selectedEntityName && (
        <Box mt={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {selectedEntityName}
          </Typography>

          <Box sx={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            mt: 1,
            border: '1px solid #555',
            borderRadius: '4px'
          }}>
            {attributes.length === 0 ? (
              <Typography variant="body2" sx={{ p: 1, color: '#aaa', fontStyle: 'italic' }}>
                Aucun attribut disponible pour cet élément.
              </Typography>
            ) : (
              attributes.map((attr, index) => (
                <Box 
                  key={`${attr.key}-${index}`}
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 1,
                    borderBottom: index < attributes.length - 1 ? '1px solid #555' : 'none',
                    backgroundColor: attr.isPset ? '#4a4a4a' : 'transparent'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'medium', mr: 2 }}>
                    {attr.isPset ? `${attr.psetName} › ${attr.key}` : attr.key}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', maxWidth: '50%', wordBreak: 'break-word' }}>
                    {attr.value}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};