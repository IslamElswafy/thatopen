import { FC, useEffect, useRef, useState, ChangeEvent, Fragment, useCallback } from 'react';
import * as BUI from "@thatopen/ui";
import * as CUI from "@thatopen/ui-obc";
import * as OBC from "@thatopen/components";
import { useRaycaster } from '../../hooks/useRaycaster';
import { useRenderer } from '../../hooks/useRenderer';
import { useIFCLoader } from '../../hooks/useIFCLoader';
import { useClassificationTreeSimple } from '../../hooks/useClassificationTree';
import { SectionsAccordion, SectionItem } from '../UI/SectionsAccordion';
import { LoadingDialog } from '../UI/LoadingDialog';
import { ClipperControl } from '../Controls/ClipperControl';
import { ModelList } from '../UI/ModelList';
import { EntityAttributes } from '../Data/EntityAttributes';
import { FormControlLabel, Checkbox, Tooltip, Paper, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useStreamingService } from '../../services/streaming';

const IFCViewer: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null!);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTiles, setIsGeneratingTiles] = useState(false);
  const [ifcModel, setIfcModel] = useState<any>(null);
  const [useStreaming, setUseStreaming] = useState(false);
  const [classificationUpdateCounter] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Obtention des composants et du monde
  const { components, world, isInitialized } = useRenderer(containerRef);
  
  // Services
  const streamingService = useStreamingService(components, world);
  
  useEffect(() => {
    // Initialisation des managers BUI et CUI
    try {
      BUI.Manager.init();
      CUI.Manager.init();
    } catch (e) {
      console.error("Erreur d'initialisation des managers:", e);
    }
  }, []);

  // Hooks personnalisés
  const { loadIFC, removeModel, loadedModels } = useIFCLoader(components, world, setIsLoading);
  const { ClassificationTreeComponent } = useClassificationTreeSimple({ 
    components, 
    updateTrigger: classificationUpdateCounter 
  });

  // Raycaster pour l'interaction
  useRaycaster({ components, world });

  // Gestion du changement de l'input file
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !components || !world) {
      console.warn("Composants manquants pour le chargement de fichier");
      return;
    }
    
    // Vérifier si le fichier est volumineux et suggérer le streaming
    const isLargeFile = file.size > 15 * 1024 * 1024; // 15MB
    if (isLargeFile && !useStreaming) {
      const useStreamingSuggestion = window.confirm('Ce fichier est volumineux. Voulez-vous utiliser le mode streaming pour de meilleures performances?');
      if (useStreamingSuggestion) {
        setUseStreaming(true);
      }
    }
    
    // Réinitialiser les états
    setError(null);
    
    // Marquer le début du chargement
    console.log('Début du chargement...');
    setIsLoading(true);
    
    try {
      let model;
      
      if (useStreaming && streamingService) {
        // Approche avec Streaming via le service dédié
        setIsGeneratingTiles(true);
        model = await streamingService.loadFileWithStreaming(file);
        setIsGeneratingTiles(false);
      } else {
        // Approche standard
        console.log('Chargement standard...');
        model = await loadIFC(file);
      }
      
      if (!model) {
        throw new Error("Le modèle n'a pas pu être chargé correctement.");
      }
      
      setIfcModel(model);
      console.log('Modèle chargé avec succès');
      
    } catch(error) {
      console.error("Erreur lors de l'import IFC :", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue lors du chargement");
    } finally {
      // S'assurer que les états de chargement sont réinitialisés
      console.log('Fin du chargement, réinitialisation des états');
      setIsLoading(false);
      setIsGeneratingTiles(false);
      
      // Réinitialiser l'input file pour permettre de charger le même fichier à nouveau
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Fonction pour gérer la suppression de modèle
  const handleModelDelete = useCallback(async (modelId: string) => {
    if (!components || !world) return;
    
    try {
      console.log(`IFCViewer: DEBUG SUPPRESSION - Début de la suppression du modèle ${modelId}`);
      
      const modelToDelete = loadedModels.find(m => m.uuid === modelId);
      if (!modelToDelete) {
        console.warn(`Modèle avec ID ${modelId} non trouvé`);
        return;
      }
      
      // Vérifier si c'est le modèle actif
      const isActiveModel = ifcModel && ifcModel.uuid === modelId;
      
      // Nettoyer les ressources spécifiques au streamer
      if (streamingService && modelToDelete.userData?.updateStreamerFunction) {
        await streamingService.cleanupModel(modelToDelete);
      }
      
      // Supprimer le modèle - opération synchronisée
      await removeModel(modelToDelete);
      
      // Si c'était le modèle actif, réinitialiser ifcModel
      if (isActiveModel) {
        setIfcModel(null);
      }
      
      // Vérification supplémentaire post-suppression
      const fragmentsManager = components.get(OBC.FragmentsManager);
      const remainingModels = fragmentsManager ? Object.keys(fragmentsManager.groups || {}).length : 0;
      console.log(`IFCViewer: DEBUG SUPPRESSION - Après suppression, modèles restants: ${remainingModels}`);
      
      // Émission d'événement explicite si plus aucun modèle
      if (remainingModels === 0) {
        console.log("IFCViewer: DEBUG SUPPRESSION - Plus aucun modèle, émission de l'événement all-models-removed");
        document.dispatchEvent(new CustomEvent('all-models-removed'));
      }
      
      return true;
    } catch(error) {
      console.error("IFCViewer: DEBUG SUPPRESSION - Erreur lors de la suppression", error);
      throw error;
    }
  }, [components, world, streamingService, removeModel, ifcModel, setIfcModel, classificationUpdateCounter]);

  const sections: SectionItem[] = [];
  if (components && world && containerRef.current) {
    sections.push({
      label: 'Importation',
      content: (
        <div>
          <label 
            htmlFor="ifc-upload" 
            style={{
              display: "inline-block",
              width: "100%",
              padding: "8px 12px",
              backgroundColor: "#007bff",
              color: "white",
              borderRadius: "5px",
              cursor: "pointer",
              textAlign: "center",
              marginBottom: "15px"
            }}
          >
            Import fichier IFC
          </label>
          <input 
            id="ifc-upload"
            type="file" 
            accept=".ifc" 
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: "none" }} 
            onClick={(e) => {
              // S'assurer que l'événement change est déclenché même si le même fichier est sélectionné
              (e.target as HTMLInputElement).value = '';
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  style={{ color: 'white' }}
                />
              }
              label="Mode streaming"
              style={{ color: 'white', marginRight: '5px' }}
            />
            <Tooltip title="Recommandé pour les gros modèles IFC. Charge progressivement les parties visibles du modèle pour économiser la mémoire." arrow>
              <HelpOutlineIcon style={{ color: 'white', fontSize: '1rem' }} />
            </Tooltip>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '5px' }}>
            {isGeneratingTiles ? 'Génération des tuiles en cours...' : 
             isLoading ? 'Chargement en cours...' : 
             error ? `Erreur: ${error}` : 'Prêt'}
          </div>
        </div>
      ),
    });
    
    sections.push({
      label: 'Classification',
      content: (
        <Paper sx={{ p: 2, m: 1, backgroundColor: '#616161', color: 'white' }}>
          <Typography variant="h6" gutterBottom>
            Classification
          </Typography>
          {loadedModels.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#aaa', fontStyle: 'italic' }}>
              Aucun modèle chargé pour afficher la classification.
            </Typography>
          ) : (
            <ClassificationTreeComponent />
          )}
        </Paper>
      ),
    });
    
    sections.push({
      label: 'Modèles chargés',
      content: (
        <ModelList 
          components={components} 
          onDeleteModel={handleModelDelete}
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
    
    sections.push({
      label: 'Entités',
      content: (
        <EntityAttributes
          components={components}
          world={world}
          model={ifcModel}
        />
      ),
    });
  }
  
  // Vérifier si le chargement est en cours
  const showLoadingDialog = isLoading || isGeneratingTiles;
  
  return (
    <Fragment>
      <div ref={containerRef} className="app-container" style={{ position: 'relative' }}>
        {isInitialized && (
          <div style={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            zIndex: 1000, 
            maxHeight: '95vh', 
            overflowY: 'auto' 
          }}>
            <SectionsAccordion sections={sections} />
          </div>
        )}
      </div>
      {showLoadingDialog && <LoadingDialog />}
    </Fragment>
  );
};

export default IFCViewer;