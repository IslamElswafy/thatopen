import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import { generateTilesFromIFC, saveTilesToStorage, prepareStreamingData } from './ifcTileGenerator';

/**
 * Interface pour la configuration du streamer IFC
 */
export interface StreamerConfig {
  threshold?: number;
  maxHiddenTime?: number;
  maxLostTime?: number;
  useCache?: boolean;
}

/**
 * Service pour gérer le streaming des modèles IFC
 */
export class StreamingService {
  private components: OBC.Components;
  private world: OBC.World;
  
  /**
   * Initialise le service de streaming
   * @param components - Instance de Components
   * @param world - Instance de World
   */
  constructor(components: OBC.Components, world: OBC.World) {
    this.components = components;
    this.world = world;
  }

  /**
   * Configure le streamer avec des paramètres spécifiques
   * @param config - Configuration du streamer
   */
  public configureStreamer(config: StreamerConfig = {}) {
    const streamer = this.components.get(OBCF.IfcStreamer);
    if (!streamer) throw new Error('IFC Streamer non disponible');
    
    streamer.world = this.world;
    streamer.useCache = config.useCache ?? true;
    
    if (streamer.culler) {
      streamer.culler.threshold = config.threshold ?? 10;
      streamer.culler.maxHiddenTime = config.maxHiddenTime ?? 1000;
      streamer.culler.maxLostTime = config.maxLostTime ?? 3000;
    }
    
    return streamer;
  }

  /**
   * Charge un fichier IFC en mode streaming
   * @param file - Fichier IFC à charger
   * @returns Le modèle 3D chargé
   */
  public async loadFileWithStreaming(file: File): Promise<THREE.Object3D> {
    console.log('Chargement avec streaming via TileGenerator...');
    
    // 1. Convertir le fichier en tuiles
    const arrayBuffer = await file.arrayBuffer();
    const ifcBuffer = new Uint8Array(arrayBuffer);
    const modelName = file.name.replace('.ifc', '');
    
    // 2. Générer les tuiles
    const tileResult = await generateTilesFromIFC(this.components, ifcBuffer, modelName);
    console.log('Tuiles générées:', tileResult);
    
    // 3. Sauvegarder les tuiles et générer les URLs
    const urlMap = saveTilesToStorage(tileResult);
    
    // 4. Préparer les données pour le streaming
    const streamingData = prepareStreamingData(tileResult, urlMap);
    
    // 5. Charger le modèle avec le streamer
    return this.loadStreamingData(streamingData);
  }

  /**
   * Charge des données de streaming préparées
   * @param streamingData - Données préparées pour le streaming
   * @returns Le modèle 3D chargé
   */
  public async loadStreamingData(streamingData: any): Promise<THREE.Object3D> {
    const streamer = this.configureStreamer();
    
    console.log('Chargement du modèle via le streamer...');
    const model = await streamer.load(
      streamingData,
      true,   // Coordonner avec les autres modèles
      undefined
    );
    
    // Configuration de l'actualisation lors du déplacement de caméra
    const updateStreamerHandler = () => {
      if (streamer.culler) {
        streamer.culler.needsUpdate = true;
      }
    };
    
    this.world.camera.controls.addEventListener('sleep', updateStreamerHandler);
    
    // Stockage de la référence pour nettoyage
    model.userData.updateStreamerFunction = updateStreamerHandler;
    
    return model;
  }

  /**
   * Charge les propriétés d'un modèle via le streamer
   * @param model - Modèle dont les propriétés doivent être chargées
   */
  public async loadModelProperties(model: THREE.Object3D): Promise<void> {
    const streamer = this.components.get(OBCF.IfcStreamer);
    if (!streamer || typeof streamer.loadProperties !== 'function') {
      throw new Error("Fonction loadProperties non disponible sur le streamer");
    }
    
    await streamer.loadProperties(model);
  }

  /**
   * Vérifie si un fichier est suffisamment volumineux pour justifier le streaming
   * @param file - Fichier à vérifier
   * @param sizeThreshold - Taille limite en octets (défaut: 15MB)
   */
  public isLargeFile(file: File, sizeThreshold: number = 15 * 1024 * 1024): boolean {
    return file.size > sizeThreshold;
  }
  
  /**
   * Nettoie les ressources associées à un modèle streamé
   * @param model - Modèle à nettoyer
   */
  public cleanupModel(model: THREE.Object3D): void {
    if (model.userData.updateStreamerFunction) {
      this.world.camera.controls.removeEventListener('sleep', model.userData.updateStreamerFunction);
      delete model.userData.updateStreamerFunction;
    }
  }
}

/**
 * Hook pour utiliser le service de streaming
 */
export function useStreamingService(components: OBC.Components | null, world: OBC.World | null) {
  if (!components || !world) {
    return null;
  }
  
  return new StreamingService(components, world);
}