import * as OBC from "@thatopen/components";
import { generateTilesFromIFC, saveTilesToStorage, prepareStreamingData, TileGenerationResult } from "../services/ifcTileGenerator";

// Mock des modules externes
jest.mock("@thatopen/components");

describe("ifcTileGenerator", () => {
  // Mocks communs
  let mockComponents: jest.Mocked<OBC.Components>;
  let mockBuffer: Uint8Array;
  let mockTiler: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockBuffer = new Uint8Array([1, 2, 3, 4]);
    
    // Mock du tiler IFC
    mockTiler = {
      settings: {
        wasm: null
      },
      onGeometryStreamed: { add: jest.fn(), remove: jest.fn() },
      onAssetStreamed: { add: jest.fn(), remove: jest.fn() },
      onIfcLoaded: { add: jest.fn(), remove: jest.fn() },
      streamFromBuffer: jest.fn().mockImplementation(async (buffer) => {
        // Simuler le processus de streaming
        const geometryStreamHandler = mockTiler.onGeometryStreamed.add.mock.calls[0][0];
        const assetStreamHandler = mockTiler.onAssetStreamed.add.mock.calls[0][0];
        const ifcLoadedHandler = mockTiler.onIfcLoaded.add.mock.calls[0][0];
        
        // Déclencher les handlers avec des données simulées
        await geometryStreamHandler({
          buffer: new Uint8Array([1, 2, 3]),
          data: { "1": { some: "data" } }
        });
        
        await assetStreamHandler([{ id: "asset1" }]);
        
        await ifcLoadedHandler(new Uint8Array([4, 5, 6]));
        
        return true;
      })
    };
    
    // Mock des Components pour retourner notre tiler
    mockComponents = {
      get: jest.fn().mockImplementation((Type) => {
        if (Type === OBC.IfcGeometryTiler) return mockTiler;
        return null;
      })
    } as unknown as jest.Mocked<OBC.Components>;
    
    // Mock localStorage pour stocker les blobs
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn()
      },
      writable: true
    });
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue("blob:test-url");
  });

  describe("generateTilesFromIFC", () => {
    it("devrait retourner les données de tuiles correctes", async () => {
      const result = await generateTilesFromIFC(mockComponents, mockBuffer, "test-model");
      
      // Vérifier que le tiler a été récupéré
      expect(mockComponents.get).toHaveBeenCalledWith(OBC.IfcGeometryTiler);
      
      // Vérifier que la méthode streamFromBuffer a été appelée avec les bons arguments
      expect(mockTiler.streamFromBuffer).toHaveBeenCalledWith(mockBuffer);
      
      // Vérifier que les gestionnaires d'événements ont été ajoutés
      expect(mockTiler.onGeometryStreamed.add).toHaveBeenCalled();
      expect(mockTiler.onAssetStreamed.add).toHaveBeenCalled();
      expect(mockTiler.onIfcLoaded.add).toHaveBeenCalled();
      
      // Vérifier les données retournées
      expect(result).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.files.length).toBe(2); // Un fichier de géométrie et un fichier global
      expect(result.globalDataFileName).toBeTruthy();
      expect(result.globalDataFileName).toContain("test-model");
    });

    it("devrait gérer l'erreur de WebAssembly correctement", async () => {
      // Simuler une erreur dans streamFromBuffer
      mockTiler.streamFromBuffer.mockRejectedValue(new Error("Erreur de tiling"));
      
      await expect(generateTilesFromIFC(mockComponents, mockBuffer, "test-model"))
        .rejects.toThrow("Erreur de tiling");
        
      // Vérifier que les handlers ont été ajoutés même si une erreur se produit
      expect(mockTiler.onGeometryStreamed.add).toHaveBeenCalled();
    });
  });

  describe("saveTilesToStorage", () => {
    it("devrait enregistrer les tuiles et retourner la map d'URLs", () => {
      const tileResult: TileGenerationResult = {
        files: [
          { name: "file1.json", bits: [new Uint8Array([1, 2, 3])] },
          { name: "file2.json", bits: [new Uint8Array([4, 5, 6])] }
        ],
        geometriesData: {},
        assetsData: [],
        globalDataFileName: "globalData.json"
      };
      
      const result = saveTilesToStorage(tileResult);
      
      expect(result).toBeDefined();
      expect(result instanceof Map).toBe(true);
      expect(result.size).toBe(2);
      expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  describe("prepareStreamingData", () => {
    it("devrait préparer correctement les données pour le streaming", () => {
      const tileResult: TileGenerationResult = {
        files: [
          { name: "file1.json", bits: [new Uint8Array([1, 2, 3])] },
          { name: "file2.json", bits: [new Uint8Array([4, 5, 6])] }
        ],
        geometriesData: {
          "1": { geometryFile: "file1.json" },
          "2": { geometryFile: "file2.json" }
        },
        assetsData: [],
        globalDataFileName: "globalData.json"
      };
      
      // Créer un Map au lieu d'un objet standard
      const urlMap = new Map<string, string>();
      urlMap.set("file1.json", "blob:url-1");
      urlMap.set("file2.json", "blob:url-2");
      urlMap.set("globalData.json", "blob:url-global");
      
      const result = prepareStreamingData(tileResult, urlMap);
      
      expect(result).toBeDefined();
      expect(result.geometries).toBeDefined();
      expect(result.assets).toBeDefined();
      expect(result.globalDataFileId).toBe("blob:url-global");
      
      // Vérifier que les chemins ont été mis à jour
      expect(result.geometries["1"].geometryFile).toBe("blob:url-1");
      expect(result.geometries["2"].geometryFile).toBe("blob:url-2");
    });
  });
});
