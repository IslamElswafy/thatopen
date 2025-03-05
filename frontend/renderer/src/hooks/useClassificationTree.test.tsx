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
    byEntity: jest.fn(),
    byPredefinedType: jest.fn().mockResolvedValue(undefined)
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
    groups: { model1: { uuid: 'model1', userData: { type: 'FragmentsGroup' } } }
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

  it('devrait afficher l\'arbre de classification après le chargement d\'un IFC', async () => {
    // Configurer le classifier avec des données
    mockClassifier.list = {
      entities: { 
        'IfcWall': { map: { '1-1': [1, 2, 3] }, name: 'Walls', id: 1 }
      }
    };
    
    const { result } = renderHook(() => 
      useClassificationTreeSimple({ components: mockComponents })
    );
    
    // Attendre que le hook soit initialisé
    await waitFor(() => {
      expect(mockComponents.get).toHaveBeenCalledWith(OBC.Classifier);
    });
    
    // Monter le composant
    const root = ReactDOM.createRoot(container);
    
    // Affichage initial
    act(() => {
      root.render(<result.current.ClassificationTreeComponent />);
    });
    act(() => {
      jest.runAllTimers();
    });
    
    // Vérifier que l'arbre est affiché
    expect(CUI.tables.classificationTree).toHaveBeenCalledTimes(1);
    
    // Simuler la vidange du classifier
    jest.clearAllMocks();
    mockClassifier.list = {};
    
    // Forcer une mise à jour
    act(() => {
      result.current.updateClassificationData();
    });
    
    // Exécuter les timers
    act(() => {
      jest.runAllTimers();
    });
    
    // Vérifier que l'arbre est toujours affiché
    // Note: Nous ne pouvons pas vérifier le contenu du texte car les tests
    // utilisent un mock d'arbre, donc nous vérifions simplement que la fonction
    // de création d'arbre est appelée
    expect(CUI.tables.classificationTree).toHaveBeenCalledTimes(1);
    
    // Nettoyer
    act(() => {
      root.unmount();
    });
  });

  it('ne devrait pas créer une boucle infinie lors de la reconstruction des classifications', async () => {
    // Vider le classifier
    mockClassifier.list = {};
    
    // Garder une référence aux modèles
    mockFragmentsManager.groups = { model1: { uuid: 'model1', userData: { type: 'FragmentsGroup' } } };
    
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
});

