import * as OBC from '@thatopen/components';

/**
 * Crée un mock de l'objet Components de OBC
 */
export function createMockComponents() {
  const mockFragmentsManager = {
    load: jest.fn().mockResolvedValue('mockFragmentId'),
    dispose: jest.fn(),
    onFragmentsLoaded: { add: jest.fn(), remove: jest.fn() },
    onFragmentsDisposed: { add: jest.fn(), remove: jest.fn() }
  };

  const mockCameraManager = {
    targetFragment: jest.fn()
  };

  const mockSimpleRaycaster = {
    castRay: jest.fn()
  };

  return {
    get: jest.fn((name) => {
      if (name === 'FragmentsManager') return mockFragmentsManager;
      if (name === 'CameraManager') return mockCameraManager;
      if (name === 'SimpleRaycaster') return mockSimpleRaycaster;
      return null;
    })
  } as unknown as OBC.Components;
}

/**
 * Crée un mock de l'objet World de OBC
 */
export function createMockWorld() {
  return {
    onCreate: { add: jest.fn(), remove: jest.fn() }
  } as unknown as OBC.World;
}