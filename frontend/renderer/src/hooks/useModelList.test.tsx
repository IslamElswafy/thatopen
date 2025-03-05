import { renderHook } from '@testing-library/react';
import { useModelList } from './useModelList';
import * as OBC from '@thatopen/components';

// Création directe d'un HTMLElement comme retour du mock
const mockElement = document.createElement('div');
const mockUpdateTable = jest.fn();

// Mock de CUI.tables.modelsList au niveau du module
jest.mock('@thatopen/ui-obc', () => {
  return {
    tables: {
      modelsList: jest.fn(() => [
        mockElement,
        { updateTable: mockUpdateTable }
      ])
    }
  };
});

describe('useModelList Hook', () => {
  const mockFragmentsManager = {
    onFragmentsLoaded: { add: jest.fn(), remove: jest.fn() },
    onFragmentsDisposed: { add: jest.fn(), remove: jest.fn() }
  };

  // Composants mockés simplifiés
  const mockComponents = {
    get: jest.fn(() => mockFragmentsManager)
  } as unknown as OBC.Components;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait initialiser la liste des modèles', () => {
    const { result } = renderHook(() => useModelList(mockComponents));
    
    expect(mockComponents.get).toHaveBeenCalled();
    expect(result.current.modelListElement).toBe(mockElement);
  });

  it('devrait permettre de rafraîchir la liste', () => {
    const { result } = renderHook(() => useModelList(mockComponents));
    
    result.current.refreshModelList();
    expect(mockUpdateTable).toHaveBeenCalled();
  });

  it('devrait nettoyer les écouteurs lors du démontage', () => {
    const { unmount } = renderHook(() => useModelList(mockComponents));
    
    unmount();
    expect(mockFragmentsManager.onFragmentsLoaded.remove).toHaveBeenCalled();
    expect(mockFragmentsManager.onFragmentsDisposed.remove).toHaveBeenCalled();
  });

  it('devrait gérer les erreurs de mise à jour', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockUpdateTable.mockImplementation(() => {
      throw new Error('Erreur de mise à jour');
    });

    const { result } = renderHook(() => useModelList(mockComponents));
    
    result.current.refreshModelList();
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    consoleWarnSpy.mockRestore();
  });
});