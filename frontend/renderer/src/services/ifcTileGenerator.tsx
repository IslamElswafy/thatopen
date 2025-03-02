import * as OBC from '@thatopen/components';

/**
 * Interface représentant les données de géométrie pour une tuile
 */
interface GeometryData {
  buffer: Uint8Array;
  data: Record<string, any>;
}

/**
 * Interface représentant un fichier de tuile
 */
interface TileFile {
  name: string;
  bits: (Uint8Array | string)[];
}

/**
 * Interface représentant les résultats de la génération de tuiles
 */
export interface TileGenerationResult {
  files: TileFile[];
  geometriesData: Record<string, any>;
  assetsData: any[];
  globalDataFileName: string;
}

/**
 * Génère des tuiles à partir d'un fichier IFC
 * 
 * Documentation: https://docs.thatopen.com/Tutorials/Components/Core/IfcGeometryTiler
 */
export const generateTilesFromIFC = async (
  components: OBC.Components,
  ifcBuffer: Uint8Array,
  modelName: string
): Promise<TileGenerationResult> => {
  // Récupérer le tiler
  const tiler = components.get(OBC.IfcGeometryTiler);
  if (!tiler) {
    throw new Error('IfcGeometryTiler non disponible');
  }

  console.log('Démarrage de la génération des tuiles...');

  // Configuration du tiler
  tiler.settings.wasm = {
    path: "https://unpkg.com/web-ifc@0.0.66/",
    absolute: true
  };
  tiler.settings.minGeometrySize = 20; // Taille minimale des géométries
  tiler.settings.minAssetsSize = 1000; // Taille minimale des assets

  console.log('Configuration du tiler terminée');

  // Préparation des données
  const files: TileFile[] = [];
  const geometriesData: Record<string, any> = {};
  let assetsData: any[] = [];
  let geometryFilesCount = 1;
  let globalDataFileName = "";

  // Configuration des écouteurs d'événements
  const onGeometryStreamedHandler = (geometry: GeometryData) => {
    const { buffer, data } = geometry;
    const bufferFileName = `${modelName}-processed-geometries-${geometryFilesCount}`;
    
    for (const expressID in data) {
      const value = data[expressID];
      value.geometryFile = bufferFileName;
      geometriesData[expressID] = value;
    }
    
    files.push({ name: bufferFileName, bits: [buffer] });
    geometryFilesCount++;
  };
  
  const onAssetStreamedHandler = (assets: any) => {
    assetsData = [...assetsData, ...assets];
  };
  
  const onIfcLoadedHandler = (groupBuffer: Uint8Array) => {
    globalDataFileName = `${modelName}-processed-global`;
    files.push({
      name: globalDataFileName,
      bits: [groupBuffer],
    });
  };

  // Ajout des écouteurs d'événements
  tiler.onGeometryStreamed.add(onGeometryStreamedHandler);
  tiler.onAssetStreamed.add(onAssetStreamedHandler);
  tiler.onIfcLoaded.add(onIfcLoadedHandler);

  try {
    // Affichage des méthodes disponibles sur tiler pour diagnostic
    console.log('Méthodes disponibles sur tiler:', 
      Object.getOwnPropertyNames(Object.getPrototypeOf(tiler)).filter(name => 
        typeof tiler[name] === 'function' && name !== 'constructor'
      )
    );
    console.log('Début de la conversion IFC en tuiles...');
    await tiler.streamFromBuffer(ifcBuffer);

    console.log('Conversion en tuiles terminée avec succès');
  } finally {
    // Nettoyage des écouteurs
    tiler.onGeometryStreamed.remove(onGeometryStreamedHandler);
    tiler.onAssetStreamed.remove(onAssetStreamedHandler);
    tiler.onIfcLoaded.remove(onIfcLoadedHandler);
  }

  // Vérification des résultats
  if (files.length === 0) {
    throw new Error('Aucune tuile générée');
  }

  console.log(`Génération terminée: ${files.length} fichiers générés`);

  // Retourne les résultats
  return {
    files,
    geometriesData,
    assetsData,
    globalDataFileName
  };
};

/**
 * Sauvegarde les tuiles générées (simulant un backend)
 */
export const saveTilesToStorage = (
  tileResult: TileGenerationResult
): Map<string, string> => {
  const urlMap = new Map<string, string>();
  
  // Création des URLs pour les fichiers
  for (const file of tileResult.files) {
    const blob = new Blob([file.bits[0]], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    urlMap.set(file.name, url);
  }
  
  return urlMap;
};

/**
 * Structure complète des données pour le streaming
 */
export const prepareStreamingData = (
  tileResult: TileGenerationResult,
  urlMap: Map<string, string>
): Record<string, any> => {
  // Prepare le JSON pour le streaming
  const streamingData = {
    assets: tileResult.assetsData,
    geometries: tileResult.geometriesData,
    globalDataFileId: tileResult.globalDataFileName
  };
  
  // Mise à jour des chemins dans geometries pour pointer vers les URLs
  for (const expressID in streamingData.geometries) {
    const geometry = streamingData.geometries[expressID];
    const fileName = geometry.geometryFile;
    geometry.geometryFile = urlMap.get(fileName);
  }
  
  // Mise à jour du chemin pour le fichier global
  streamingData.globalDataFileId = urlMap.get(tileResult.globalDataFileName);
  
  return streamingData;
};

/**
 * Nettoie les ressources créées
 */
export const cleanupTileResources = (urlMap: Map<string, string>): void => {
  for (const url of urlMap.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Erreur lors de la révocation de URL:', url, e);
    }
  }
};