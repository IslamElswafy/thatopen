import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { StreamingService, StreamerConfig, useStreamingService } from "../services/streaming";
import { generateTilesFromIFC, saveTilesToStorage, prepareStreamingData, TileGenerationResult } from "../services/ifcTileGenerator";

// Mock des modules externes
jest.mock("three");
jest.mock("@thatopen/components");
jest.mock("../services/ifcTileGenerator");

// Mock manuel pour @thatopen/components-front au lieu de l'importer directement
// Ce qui résout le problème "Cannot use import statement outside a module"
const OBCF = {
  IfcStreamer: "IfcStreamer"
};

jest.mock("@thatopen/components-front", () => ({
  IfcStreamer: "IfcStreamer"
}));

describe("StreamingService", () => {
  // Setup des mocks communs
  let mockComponents: jest.Mocked<OBC.Components>;
  let mockWorld: jest.Mocked<OBC.World>;
  let mockStreamer: any; 
  let mockCuller: any;
  let mockCamera: any;
  let mockControls: any;
  let service: StreamingService;
  let mockFragmentsGroup: any;

  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();

    // Configuration des mocks
    mockCuller = {
      threshold: 0,
      maxHiddenTime: 0,
      maxLostTime: 0,
      needsUpdate: false
    };

    mockControls = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    mockCamera = {
      controls: mockControls
    };

    // Création d'un mock pour FragmentsGroup
    mockFragmentsGroup = {
      // Propriétés obligatoires pour FragmentsGroup
      items: [],
      boundingBox: new THREE.Box3(),
      coordinationMatrix: new THREE.Matrix4(),
      keyFragments: new Map(),
      uuid: "test-uuid",
      getWorldPosition: jest.fn(),
      getWorldQuaternion: jest.fn(),
      getWorldScale: jest.fn(),
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      quaternion: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
      visible: true,
      userData: {},
      type: "FragmentsGroup",
      parent: null,
      children: [],
      up: new THREE.Vector3(0, 1, 0),
      // Méthodes de Object3D
      add: jest.fn(),
      remove: jest.fn(),
      updateMatrix: jest.fn(),
      updateMatrixWorld: jest.fn(),
    };

    mockStreamer = {
      world: null,
      culler: mockCuller,
      useCache: false,
      load: jest.fn().mockResolvedValue(mockFragmentsGroup)
    };

    // Correction : Assurez-vous que la méthode get retourne mockStreamer pour OBCF.IfcStreamer
    mockComponents = {
      get: jest.fn((componentClass) => {
        // Le problème est ici - "IfcStreamer" (string) != OBCF.IfcStreamer (aussi une string, mais comparaison stricte)
        // Changement pour comparer avec la valeur attendue dans le service
        return mockStreamer;
      })
    } as unknown as jest.Mocked<OBC.Components>;

    mockWorld = {
      camera: mockCamera
    } as unknown as jest.Mocked<OBC.World>;

    // Initialisation du service avec mocks
    service = new StreamingService(mockComponents, mockWorld);

    // Mock des fonctions externes
    (generateTilesFromIFC as jest.Mock).mockResolvedValue({
      files: [{ name: "file1.json", data: new Uint8Array([1, 2, 3]) }],  // Utilisation de 'name' au lieu de 'id'
      geometriesData: {},
      assetsData: [],
      globalDataFileName: "globalData.json"
    });

    // Le résultat de saveTilesToStorage doit être un Map
    const urlMap = new Map<string, string>();
    urlMap.set("1", "blob:http://localhost:3000/test-tile-1");
    (saveTilesToStorage as jest.Mock).mockReturnValue(urlMap);

    (prepareStreamingData as jest.Mock).mockReturnValue({
      modelID: "test-model",
      urls: { 1: "blob:http://localhost:3000/test-tile-1" }
    });
  });

  describe("configureStreamer", () => {
    it("configure le streamer avec des valeurs par défaut", () => {
      // Ne pas surcharger configureStreamer, nous voulons tester le vrai comportement
      // Retirer le spyOn et laisser la méthode originale s'exécuter
      
      const result = service.configureStreamer();

      // Vérifie juste l'appel du getter
      expect(mockComponents.get).toHaveBeenCalledWith(OBCF.IfcStreamer);
      expect(result).toBe(mockStreamer);
      expect(result.world).toBe(mockWorld);
      expect(result.useCache).toBe(true);
      expect(mockCuller.threshold).toBe(10);
      expect(mockCuller.maxHiddenTime).toBe(1000);
      expect(mockCuller.maxLostTime).toBe(3000);
    });

    it("configure le streamer avec des paramètres personnalisés", () => {
      const config: StreamerConfig = {
        threshold: 20,
        maxHiddenTime: 2000,
        maxLostTime: 4000,
        useCache: false
      };

      const result = service.configureStreamer(config);

      expect(result.useCache).toBe(false);
      expect(mockCuller.threshold).toBe(20);
      expect(mockCuller.maxHiddenTime).toBe(2000);
      expect(mockCuller.maxLostTime).toBe(4000);
    });

    it("lance une erreur si le streamer n'est pas disponible", () => {
      mockComponents.get.mockReturnValue(null);

      expect(() => service.configureStreamer()).toThrow('IFC Streamer non disponible');
    });
  });

  describe("loadFileWithStreaming", () => {
    it("charge un fichier IFC avec streaming correctement", async () => {
      // Setup mock File
      const mockArrayBuffer = new ArrayBuffer(10);
      const mockFile = {
        name: "test.ifc",
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
        size: 20 * 1024 * 1024
      } as unknown as File;

      // Mock de configureStreamer et loadStreamingData
      jest.spyOn(service, 'configureStreamer').mockReturnValue(mockStreamer);
      jest.spyOn(service, 'loadStreamingData').mockResolvedValue(mockFragmentsGroup);

      // Exécution
      await service.loadFileWithStreaming(mockFile);

      // Vérifications
      expect(mockFile.arrayBuffer).toHaveBeenCalled();
      expect(generateTilesFromIFC).toHaveBeenCalledWith(
        mockComponents,
        expect.any(Uint8Array),
        "test"
      );
      expect(saveTilesToStorage).toHaveBeenCalled();
      expect(prepareStreamingData).toHaveBeenCalled();
      expect(service.loadStreamingData).toHaveBeenCalled();
    });

    it("gère les erreurs de génération de tuiles", async () => {
      // Simuler l'erreur WebAssembly
      (generateTilesFromIFC as jest.Mock).mockRejectedValue(
        new Error("WebAssembly.instantiate(): expected magic word 00 61 73 6d, found 3c 21 64 6f @+0")
      );

      const mockFile = {
        name: "test.ifc",
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(10)),
        size: 20 * 1024 * 1024
      } as unknown as File;

      // Vérification que l'erreur est propagée
      await expect(service.loadFileWithStreaming(mockFile)).rejects.toThrow();
    });
  });

  describe("loadStreamingData", () => {
    it("charge correctement les données de streaming", async () => {
      const mockStreamingData = {
        modelID: "test-model",
        urls: { 1: "blob:http://localhost:3000/test-tile-1" }
      };

      // Utilisation du mockFragmentsGroup au lieu de THREE.Object3D
      mockStreamer.load.mockResolvedValue(mockFragmentsGroup);

      const result = await service.loadStreamingData(mockStreamingData);

      expect(mockStreamer.load).toHaveBeenCalledWith(
        mockStreamingData,
        true,
        undefined
      );
      expect(mockControls.addEventListener).toHaveBeenCalledWith(
        'sleep',
        expect.any(Function)
      );
      expect(result).toBe(mockFragmentsGroup);
      expect(result.userData.updateStreamerFunction).toBeDefined();
    });
  });

  describe("loadModelProperties", () => {
    it("charge les propriétés d'un modèle", async () => {
      // Utiliser mockFragmentsGroup au lieu de THREE.Object3D
      mockFragmentsGroup.userData.streamSettings = {
        modelID: "test-model",
        properties: true
      };

      await service.loadModelProperties(mockFragmentsGroup);

      expect(mockStreamer.load).toHaveBeenCalledWith(
        mockFragmentsGroup.userData.streamSettings,
        true,
        undefined
      );
    });

    it("lance une erreur si le streamer n'est pas disponible", async () => {
      mockComponents.get.mockReturnValue(null);
      mockFragmentsGroup.userData.streamSettings = {};

      await expect(service.loadModelProperties(mockFragmentsGroup)).rejects.toThrow(
        "Streamer non disponible"
      );
    });

    it("lance une erreur si les paramètres de streaming sont absents", async () => {
      mockFragmentsGroup.userData = {}; // Pas de streamSettings

      await expect(service.loadModelProperties(mockFragmentsGroup)).rejects.toThrow(
        "Model streaming settings not found"
      );
    });
  });

  describe("isLargeFile", () => {
    it("identifie correctement les grands fichiers", () => {
      const smallFile = { size: 10 * 1024 * 1024 } as File;
      const largeFile = { size: 20 * 1024 * 1024 } as File;
      
      expect(service.isLargeFile(smallFile)).toBe(false);
      expect(service.isLargeFile(largeFile)).toBe(true);
    });

    it("accepte un seuil personnalisé", () => {
      const file = { size: 5 * 1024 * 1024 } as File;
      
      expect(service.isLargeFile(file, 2 * 1024 * 1024)).toBe(true);
      expect(service.isLargeFile(file, 10 * 1024 * 1024)).toBe(false);
    });
  });

  describe("cleanupModel", () => {
    it("nettoie correctement les ressources d'un modèle", () => {
      const mockFunction = jest.fn();
      mockFragmentsGroup.userData.updateStreamerFunction = mockFunction;

      service.cleanupModel(mockFragmentsGroup);

      expect(mockControls.removeEventListener).toHaveBeenCalledWith(
        'sleep',
        mockFunction
      );
      expect(mockFragmentsGroup.userData.updateStreamerFunction).toBeUndefined();
    });

    it("ne fait rien si pas de fonction d'update", () => {
      mockFragmentsGroup.userData = {};

      service.cleanupModel(mockFragmentsGroup);
      
      expect(mockControls.removeEventListener).not.toHaveBeenCalled();
    });
  });

  describe("useStreamingService hook", () => {
    it("retourne null si components ou world n'est pas défini", () => {
      expect(useStreamingService(null, mockWorld)).toBeNull();
      expect(useStreamingService(mockComponents, null)).toBeNull();
    });

    it("retourne une instance StreamingService si components et world sont définis", () => {
      const result = useStreamingService(mockComponents, mockWorld);
      expect(result).toBeInstanceOf(StreamingService);
    });
  });

  // Test spécifique pour l'erreur WASM signalée
  describe("gestion des erreurs WebAssembly", () => {
    it("gère l'erreur de compilation WASM", async () => {
      // Configuration pour simuler l'erreur spécifique
      (generateTilesFromIFC as jest.Mock).mockRejectedValue(
        new Error("CompileError: WebAssembly.instantiate(): expected magic word 00 61 73 6d, found 3c 21 64 6f @+0")
      );

      const mockFile = {
        name: "test.ifc",
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(10)),
        size: 20 * 1024 * 1024
      } as unknown as File;

      // Vérification que l'erreur est bien capturée et propagée
      await expect(service.loadFileWithStreaming(mockFile)).rejects.toThrow(/WebAssembly/);
      
      // On vérifie qu'on a bien essayé de générer les tuiles
      expect(generateTilesFromIFC).toHaveBeenCalled();
      // Mais que les étapes suivantes n'ont pas été exécutées
      expect(saveTilesToStorage).not.toHaveBeenCalled();
    });
  });
});
