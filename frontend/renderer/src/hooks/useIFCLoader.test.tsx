import { renderHook, act } from '@testing-library/react';
import { useIFCLoader } from './useIFCLoader';
import * as OBC from '@thatopen/components';
import * as THREE from 'three';
import { createMockComponents, createMockWorld } from '../test/__mocks__/mockComponents';
import { updateRaycasterTargets } from '../services/raycaster';

// Mock pour le service raycaster pour éviter l'erreur
jest.mock('../services/raycaster', () => ({
  updateRaycasterTargets: jest.fn()
}));

// Mock pour File.arrayBuffer (utilisé dans loadIFC)
File.prototype.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8));

describe('useIFCLoader Hook', () => {
  let mockComponents: OBC.Components;
  let mockWorld: OBC.World;
  const mockSetIsLoading = jest.fn();
  const mockFile = new File(['dummy content'], 'model.ifc', { type: 'application/octet-stream' });
  
  // Mock spécifique pour IfcLoader
  const mockIfcLoader = {
    settings: { wasm: { path: "", absolute: false } },
    load: jest.fn().mockResolvedValue({ 
      name: 'mockModel', 
      uuid: 'mockId',
      userData: {},
      traverse: jest.fn()
    })
  };

  // Mock pour Raycasters
  const mockRaycasters = {
    get: jest.fn(() => ({
      targets: []
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Création des mocks de base
    mockComponents = createMockComponents();
    mockWorld = createMockWorld();
    
    // Configuration des mocks plus spécifiques
    (mockComponents.get as jest.Mock).mockImplementation((type) => {
      if (type === OBC.IfcLoader) return mockIfcLoader;
      if (type === OBC.FragmentsManager) return {
        onFragmentsLoaded: { add: jest.fn(), trigger: jest.fn() },
        onFragmentsDisposed: { add: jest.fn(), trigger: jest.fn() }
      };
      if (type === OBC.SimpleRaycaster) return { castRay: jest.fn() };
      if (type === OBC.Raycasters) return mockRaycasters;
      return null;
    });
    
    // Mock pour scene
    if (!mockWorld.scene) {
      (mockWorld as any).scene = {
        three: {
          add: jest.fn(),
          remove: jest.fn()
        }
      };
    }
  });

  it('devrait initialiser le loader IFC', () => {
    const { result } = renderHook(() => 
      useIFCLoader(mockComponents, mockWorld, mockSetIsLoading)
    );
    
    expect(result.current).toHaveProperty('loadIFC');
    expect(result.current).toHaveProperty('removeModel');
    expect(result.current).toHaveProperty('removeAllModels');
  });

  it('devrait charger un modèle IFC', async () => {
    const { result } = renderHook(() => 
      useIFCLoader(mockComponents, mockWorld, mockSetIsLoading)
    );
    
    // Utilisation de act() pour envelopper l'action qui met à jour l'état React
    await act(async () => {
      await result.current.loadIFC(mockFile);
    });
    
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockIfcLoader.load).toHaveBeenCalled();
    expect(mockWorld.scene.three.add).toHaveBeenCalled();
    expect(updateRaycasterTargets).toHaveBeenCalled();
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });

  it('devrait gérer les erreurs de chargement', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockIfcLoader.load.mockRejectedValueOnce(new Error('Erreur de chargement'));
    
    const { result } = renderHook(() => 
      useIFCLoader(mockComponents, mockWorld, mockSetIsLoading)
    );
    
    let error;
    await act(async () => {
      try {
        await result.current.loadIFC(mockFile);
      } catch (e) {
        error = e;
      }
    });
    
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Erreur de chargement');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
    consoleErrorSpy.mockRestore();
  });
  
  it('devrait permettre de supprimer un modèle', () => {
    const { result } = renderHook(() => 
      useIFCLoader(mockComponents, mockWorld, mockSetIsLoading)
    );
    
    const mockModel = { 
      name: 'testModel',
      uuid: 'test-uuid',
      traverse: jest.fn(),
      userData: {}
    } as unknown as THREE.Object3D;
    
    // Utilisation de act() pour envelopper l'action qui met à jour l'état React
    act(() => {
      result.current.removeModel(mockModel);
    });
    
    expect(mockWorld.scene.three.remove).toHaveBeenCalledWith(mockModel);
    expect(updateRaycasterTargets).toHaveBeenCalled();
  });

  it('devrait gérer correctement une erreur de chargement WASM', async () => {
    // Sauvegarde de l'environnement original
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Spy sur console pour capturer les messages
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Simuler une erreur spécifique au WASM
    const wasmError = new TypeError("wasmTable.get is not a function");
    mockIfcLoader.load.mockRejectedValueOnce(wasmError);

    const { result } = renderHook(() => 
      useIFCLoader(mockComponents, mockWorld, mockSetIsLoading)
    );
    
    let error;
    await act(async () => {
      try {
        await result.current.loadIFC(mockFile);
      } catch (e) {
        error = e;
      }
    });
    
    // Vérifications
    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe("wasmTable.get is not a function");
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
    
    // Restauration de l'environnement
    process.env.NODE_ENV = originalNodeEnv;
    
    // Nettoyage des spies
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});