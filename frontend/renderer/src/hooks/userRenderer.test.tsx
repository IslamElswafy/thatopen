// src/hooks/useRenderer.test.tsx
import { renderHook } from '@testing-library/react';
import { useRenderer } from './useRenderer';
import * as OBC from "@thatopen/components";
import { initRenderer, disposeRenderer, initManagers } from '../services/renderer';

// Mocks
jest.mock('@thatopen/components');
jest.mock('../services/renderer', () => ({
  initRenderer: jest.fn(),
  disposeRenderer: jest.fn(),
  initManagers: jest.fn()
}));

describe('useRenderer Hook', () => {
  const mockContainerRef = {
    current: document.createElement('div')
  };
  
  const mockComponents = {} as OBC.Components;
  const mockWorld = {} as OBC.World;

  beforeEach(() => {
    jest.clearAllMocks();
    (initRenderer as jest.Mock).mockReturnValue({ components: mockComponents, world: mockWorld });
  });

  it('devrait initialiser correctement le renderer lorsque le conteneur est disponible', () => {
    const { result } = renderHook(() => useRenderer(mockContainerRef));
    
    expect(initManagers).toHaveBeenCalled();
    expect(initRenderer).toHaveBeenCalledWith(mockContainerRef.current);
    expect(result.current).toEqual({
      components: mockComponents,
      world: mockWorld,
      isInitialized: true
    });
  });

  it('ne devrait pas initialiser le renderer si le conteneur est null', () => {
    const { result } = renderHook(() => useRenderer({ current: null }));
    
    expect(initManagers).not.toHaveBeenCalled();
    expect(initRenderer).not.toHaveBeenCalled();
    expect(result.current).toEqual({
      components: null,
      world: null,
      isInitialized: false
    });
  });

  it('devrait appeler disposeRenderer lors du démontage', () => {
    const { unmount } = renderHook(() => useRenderer(mockContainerRef));
    
    unmount();
    expect(disposeRenderer).toHaveBeenCalledWith(mockWorld);
  });
});