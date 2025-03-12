import { renderHook } from '@testing-library/react';
import { useRaycaster } from '../hooks/useRaycaster';
import * as OBC from '@thatopen/components';
import { updateRaycasterTargets } from '../services/raycaster';

// Mock pour le service raycaster
jest.mock('../services/raycaster', () => ({
  updateRaycasterTargets: jest.fn()
}));

describe('useRaycaster Hook', () => {
  // Mock des composants nécessaires
  const mockRaycaster = {
    castRay: jest.fn(),
    targets: []
  };

  const mockRaycasters = {
    get: jest.fn().mockReturnValue(mockRaycaster)
  };

  const mockComponents = {
    get: jest.fn((type) => {
      if (type === OBC.SimpleRaycaster) return mockRaycaster;
      if (type === OBC.Raycasters) return mockRaycasters;
      return null;
    })
  } as unknown as OBC.Components;

  const mockWorld = {
    camera: { controls: { enableRotate: jest.fn() } },
    meshes: { add: jest.fn() }
  } as unknown as OBC.World;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait initialiser le hook et fournir la méthode updateTargets', () => {
    const { result } = renderHook(() => 
      useRaycaster({ components: mockComponents, world: mockWorld })
    );
    
    expect(typeof result.current.updateTargets).toBe('function');
    expect(updateRaycasterTargets).toHaveBeenCalledWith(mockComponents, mockWorld);
  });

  it('devrait permettre de mettre à jour les cibles manuellement', () => {
    const { result } = renderHook(() => 
      useRaycaster({ components: mockComponents, world: mockWorld })
    );
    
    // Réinitialiser le mock
    (updateRaycasterTargets as jest.Mock).mockClear();
    
    // Appeler la méthode manuellement
    result.current.updateTargets();
    
    expect(updateRaycasterTargets).toHaveBeenCalledWith(mockComponents, mockWorld);
  });

  it('ne devrait pas appeler updateRaycasterTargets si les composants sont null', () => {
    const { result } = renderHook(() => 
      useRaycaster({ components: null, world: mockWorld })
    );
    
    expect(updateRaycasterTargets).not.toHaveBeenCalled();
    
    // Vérifier que la fonction updateTargets est toujours disponible
    result.current.updateTargets();
    expect(updateRaycasterTargets).not.toHaveBeenCalled();
  });

  it('ne devrait pas appeler updateRaycasterTargets si le monde est null', () => {
    const { result } = renderHook(() => 
      useRaycaster({ components: mockComponents, world: null })
    );
    
    expect(updateRaycasterTargets).not.toHaveBeenCalled();
    
    // Vérifier que la fonction updateTargets est toujours disponible
    result.current.updateTargets();
    expect(updateRaycasterTargets).not.toHaveBeenCalled();
  });

  it('devrait nettoyer les écouteurs lors du démontage', () => {
    const spyRemoveEventListener = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => 
      useRaycaster({ components: mockComponents, world: mockWorld })
    );
    
    unmount();
    
    expect(spyRemoveEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    spyRemoveEventListener.mockRestore();
  });
});