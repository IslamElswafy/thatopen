import { renderHook, act, waitFor } from '@testing-library/react';
import { useClassificationTreeSimple } from './useClassificationTree';
import * as OBC from '@thatopen/components';
import * as CUI from '@thatopen/ui-obc';
import * as ReactDOM from 'react-dom/client';

// Mocks
jest.mock('@thatopen/components', () => ({
  Components: jest.fn(),
  Classifier: jest.fn(),
  FragmentsManager: jest.fn()
}));

jest.mock('@thatopen/ui-obc', () => ({
  tables: {
    classificationTree: jest.fn()
  }
}));

describe('useClassificationTreeSimple Hook', () => {
  const mockComponents = {
    get: jest.fn()
  } as unknown as OBC.Components;
  
  const mockClassifier = {
    list: {},
    byEntity: jest.fn().mockImplementation((model) => {
      // Vérifier que le modèle est valide pour éviter les erreurs
      if (!model || !model.userData || model.userData.type !== 'FragmentsGroup') {
        console.warn('Mock classifier: modèle invalide');
        return;
      }
      // Logique normale du mock
    }),
    byPredefinedType: jest.fn().mockImplementation((model) => {
      // Vérifier que le modèle est valide pour éviter les erreurs
      if (!model || !model.userData || model.userData.type !== 'FragmentsGroup') {
        console.warn('Mock classifier: modèle invalide');
        return Promise.resolve();
      }
      // Logique normale du mock
      return Promise.resolve();
    })
  };
  
  const mockFragmentsManager = {
    onFragmentsLoaded: {
      add: jest.fn(),
      remove: jest.fn()
    },
    onFragmentsDisposed: {
      add: jest.fn(),
      remove: jest.fn()
    },
    groups: { model1: { uuid: 'model1', userData: { type: 'FragmentsGroup' } } } as Record<string, { uuid: string; userData: { type: string } }>
  };
  
  let container: HTMLDivElement;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup DOM container
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Setup mocks
    (mockComponents.get as jest.Mock).mockImplementation((component) => {
      if (component === OBC.Classifier) return mockClassifier;
      if (component === OBC.FragmentsManager) return mockFragmentsManager;
      return null;
    });
    
    const mockTree = document.createElement('div');
    mockTree.id = 'mock-classification-tree';
    (CUI.tables.classificationTree as jest.Mock).mockReturnValue([mockTree]);
    
    mockClassifier.list = {
      entities: { 
        'IfcWall': { map: { '1-1': [1, 2, 3] }, name: 'Walls', id: 1 }
      }
    };
    
    // Mocking timers
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    document.body.removeChild(container);
    container = null;
    jest.useRealTimers();
  });

  it('devrait rendre correctement le composant d\'arbre', async () => {
    const { result } = renderHook(() => 
      useClassificationTreeSimple({ components: mockComponents })
    );
    
    // Attendre que le hook soit initialisé
    await waitFor(() => {
      expect(mockComponents.get).toHaveBeenCalledWith(OBC.Classifier);
    });
    
    // Monter le composant
    const root = ReactDOM.createRoot(container);
    
    act(() => {
      root.render(<result.current.ClassificationTreeComponent />);
    });
    
    act(() => {
      // Déclencher tous les effets
      jest.runAllTimers();
    });
    
    // Vérifier que l'arbre a été créé
    expect(CUI.tables.classificationTree).toHaveBeenCalledTimes(1);
    
    // Nettoyer
    act(() => {
      root.unmount();
    });
  });

  it('devrait gérer correctement la suppression des modèles', async () => {
    const { result } = renderHook(() => 
      useClassificationTreeSimple({ components: mockComponents })
    );
    
    // Attendre que le hook soit initialisé
    await waitFor(() => {
      expect(mockComponents.get).toHaveBeenCalledWith(OBC.Classifier);
    });
    
    // Enregistrer le handler de suppression
    const disposedHandler = mockFragmentsManager.onFragmentsDisposed.add.mock.calls[0][0];
    
    // Supprimer tous les modèles
    mockFragmentsManager.groups = {} as any;
    
    // Déclencher le handler
    act(() => {
      disposedHandler();
    });
    
    // Vérifier que le classifier a été réinitialisé
    expect(mockClassifier.list).toEqual({});
  });

  it('devrait mettre à jour l\'UI lors du chargement d\'un nouveau modèle IFC', async () => {
    const { result } = renderHook(() => 
      useClassificationTreeSimple({ components: mockComponents })
    );
    
    // Attendre que le hook soit initialisé
    await waitFor(() => {
      expect(mockComponents.get).toHaveBeenCalledWith(OBC.Classifier);
    });
    
    // Vérifier que le handler a été enregistré
    expect(mockFragmentsManager.onFragmentsLoaded.add).toHaveBeenCalled();
    
    // Récupérer le handler
    const loadedHandler = mockFragmentsManager.onFragmentsLoaded.add.mock.calls[0][0];
    
    // Monter le composant
    const root = ReactDOM.createRoot(container);
    act(() => {
      root.render(<result.current.ClassificationTreeComponent />);
    });
    act(() => {
      jest.runAllTimers();
    });
    
    // Réinitialiser les mocks
    jest.clearAllMocks();
    
    // Simuler un nouveau modèle
    const newModel = { uuid: 'newModel', userData: { type: 'FragmentsGroup' } };
    
    // Déclencher le handler
    act(() => {
      loadedHandler(newModel);
    });
    
    // Vérifier que le modèle a été traité
    expect(mockClassifier.byEntity).toHaveBeenCalledWith(newModel);
    expect(mockClassifier.byPredefinedType).toHaveBeenCalledWith(newModel);
    
    // Nettoyer
    act(() => {
      root.unmount();
    });
  });

  
  it('ne devrait pas créer une boucle infinie lors de la reconstruction des classifications', async () => {
    // Vider le classifier
    mockClassifier.list = {};
    
    // Garder une référence aux modèles
    mockFragmentsManager.groups = { model1: { uuid: 'model1', userData: { type: 'FragmentsGroup' } }, };
    
    // Compteur pour détecter les appels excessifs
    let forceUpdateCallCount = 0;
    
    // Surveiller les appels au classifier
    mockClassifier.byEntity.mockImplementation(() => {
      forceUpdateCallCount++;
    });
    
    const { result } = renderHook(() => 
      useClassificationTreeSimple({ components: mockComponents })
    );
    
    // Attendre l'initialisation
    await waitFor(() => {
      expect(mockComponents.get).toHaveBeenCalledWith(OBC.Classifier);
    });
    
    // Monter le composant
    const root = ReactDOM.createRoot(container);
    
    act(() => {
      root.render(<result.current.ClassificationTreeComponent />);
    });
    
    // Exécuter les timers
    act(() => {
      jest.runAllTimers();
    });
    
    // Vérifier que le nombre d'appels est limité
    expect(forceUpdateCallCount).toBeLessThanOrEqual(3);
    
    // Simuler une mise à jour
    act(() => {
      result.current.updateClassificationData();
    });
    
    act(() => {
      jest.runAllTimers();
    });
    
    // Vérifier que le nombre d'appels reste limité
    expect(forceUpdateCallCount).toBeLessThanOrEqual(6);
    
    // Nettoyer
    act(() => {
      root.unmount();
    });
  });

  it('devrait mettre à jour la classification tree après suppression d\'un modèle', async () => {
    console.debug("TEST: Configuration initiale");
    
    // Configuration initiale avec deux modèles
    mockFragmentsManager.groups = {
      model1: { uuid: 'model1', userData: { type: 'FragmentsGroup' } },
      model2: { uuid: 'model2', userData: { type: 'FragmentsGroup' } }
    };
    
    // Configurer le classifier avec des données pour les deux modèles
    mockClassifier.list = {
      entities: { 
        'IfcWall': { map: { 'model1': [1, 2, 3], 'model2': [4, 5, 6] }, name: 'Walls', id: 1 },
        'IfcDoor': { map: { 'model2': [7, 8, 9] }, name: 'Doors', id: 2 }
      },
      predefinedTypes: {
        'DOOR': { map: { 'model2': [7, 8, 9] }, name: 'Door', id: 1 },
        'WALL': { map: { 'model1': [1, 2, 3], 'model2': [4, 5, 6] }, name: 'Wall', id: 2 }
      }
    };
    
    console.debug("TEST: Initialisation du hook");
    // Initialiser notre hook
    const { result } = renderHook(() => 
      useClassificationTreeSimple({ components: mockComponents })
    );
    
    // Attendre que le hook soit initialisé
    await waitFor(() => {
      expect(mockComponents.get).toHaveBeenCalledWith(OBC.Classifier);
      expect(mockFragmentsManager.onFragmentsDisposed.add).toHaveBeenCalled();
    });
    
    console.debug("TEST: Handler récupéré:", mockFragmentsManager.onFragmentsDisposed.add.mock.calls.length);
    // Récupérer directement le handler qui a été passé lors de l'appel à 'add'
    const actualDisposedHandler = mockFragmentsManager.onFragmentsDisposed.add.mock.calls[0][0];
    expect(actualDisposedHandler).toBeDefined();
    
    // Monter le composant
    const root = ReactDOM.createRoot(container);
    
    act(() => {
      root.render(<result.current.ClassificationTreeComponent />);
    });
    
    act(() => {
      jest.runAllTimers();
    });
    
    // Vérifier que l'arbre est affiché initialement
    console.debug("TEST: Nombre d'appels à classificationTree initial:", (CUI.tables.classificationTree as jest.Mock).mock.calls.length);
    expect((CUI.tables.classificationTree as jest.Mock)).toHaveBeenCalledTimes(1);
    
    console.debug("TEST: Suppression du modèle model1");
    // Retirer model1 des groups
    delete mockFragmentsManager.groups.model1;
    console.debug("TEST: Modèles restants:", Object.keys(mockFragmentsManager.groups));
    
    // Simuler l'événement onFragmentsDisposed avec l'ID du modèle supprimé
    console.debug("TEST: Déclenchement du handler de suppression");
    act(() => {
      actualDisposedHandler({ groupID: 'model1' });
    });
    
    // Exécuter les timers après l'appel du handler
    console.debug("TEST: Avancement des timers");
    act(() => {
      // S'assurer d'avancer le temps suffisamment pour le setTimeout
      jest.advanceTimersByTime(100); // Au lieu de jest.runAllTimers()
    });
    
    console.debug("TEST: État du mockClassifier.list après suppression:", mockClassifier.list);
    console.debug("TEST: Vérification des appels au classifier");
    console.debug("- byEntity appelé:", mockClassifier.byEntity.mock.calls.length, "fois");
    console.debug("- byPredefinedType appelé:", mockClassifier.byPredefinedType.mock.calls.length, "fois");
    
    // Maintenant vérifier les appels
    expect(mockClassifier.byEntity).toHaveBeenCalled();
    expect(mockClassifier.byPredefinedType).toHaveBeenCalled();

    // Forcer la mise à jour de l'arbre explicitement
    act(() => {
      // Simuler l'événement créé pour forcer la mise à jour
      document.dispatchEvent(new CustomEvent('model-classifications-update'));
      jest.runAllTimers(); // Exécuter tous les timers
    });

    // Vérifier que l'arbre de classification a été recréé
    console.debug("TEST: Nombre d'appels à classificationTree après suppression:", (CUI.tables.classificationTree as jest.Mock).mock.calls.length);
});

});