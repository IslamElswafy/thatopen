import { useState } from 'react';
import { render, act } from '@testing-library/react';
import * as OBC from '@thatopen/components';
import { ModelList } from '../components/UI/ModelList';
import { useClassificationTreeSimple } from '../hooks/useClassificationTree';

// Mocks
jest.mock('@thatopen/ui-obc', () => ({
  tables: {
    modelsList: jest.fn().mockReturnValue([
      document.createElement('div'),
      { updateTable: jest.fn() }
    ]),
    classificationTree: jest.fn().mockReturnValue(document.createElement('div'))
  }
}));

describe('Intégration ModelList et Classification Tree', () => {
  it('devrait afficher "Aucun modèle chargé" après suppression du dernier modèle', async () => {
    // Setup
    jest.useFakeTimers();
    
    // Type pour éviter les erreurs TypeScript
    type EntitiesType = { [key: string]: { map: { [key: string]: number[] }; name: string; id: number } };
    
    // Créer un mock pour le classifier
    const mockClassifier = {
      byEntity: jest.fn(),
      byPredefinedType: jest.fn(),
      list: {
        entities: { 'IfcWall': { map: { 'model1': [1] }, name: 'Walls', id: 1 } } as EntitiesType,
        predefinedTypes: {}
      }
    };
    
    // Créer un mock pour le FragmentsManager
    const mockFragmentsManager = {
      onFragmentsLoaded: { add: jest.fn(), remove: jest.fn() },
      onFragmentsDisposed: { add: jest.fn(), remove: jest.fn() },
      groups: {
        model1: { uuid: 'model1', userData: { type: 'FragmentsGroup' } }
      }
    };
    
    // Mock Components
    const mockComponents = {
      get: jest.fn((component) => {
        if (component === OBC.FragmentsManager) return mockFragmentsManager;
        if (component === OBC.Classifier) return mockClassifier;
        return null;
      }),
      onDisposed: { add: jest.fn(), remove: jest.fn() },
      list: jest.fn().mockReturnValue([]),
      enabled: true,
      _clock: { getDelta: jest.fn(), getElapsedTime: jest.fn() },
      renderManager: { renderer: {} },
      camera: { position: {}, getWorldDirection: jest.fn() },
      container: document.createElement('div'),
      meshes: [],
      dispose: jest.fn(),
      update: jest.fn(),
      castRay: jest.fn()
    } as unknown as OBC.Components;
    
    // Espionner les événements
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    
    // Créer un composant qui simule l'application réelle
    function TestApp() {
      const [renderCount, setRenderCount] = useState(0);
      const { ClassificationTreeComponent } = useClassificationTreeSimple({ components: mockComponents });
      
      const handleDeleteModel = (modelId: string) => {
        console.log(`Suppression du modèle ${modelId}`);
        
        // Supprimer le modèle du FragmentsManager
        delete mockFragmentsManager.groups[modelId];
        
        // Déclencher l'événement de suppression
        const handler = mockFragmentsManager.onFragmentsDisposed.add.mock.calls[0][0];
        if (handler) {
          handler({ groupID: modelId });
        }
        
        // Nettoyer les données du classifier en conservant la structure
        mockClassifier.list.entities = {} as EntitiesType;
        
        // Forcer un re-render après la suppression (pour simuler l'application réelle)
        setRenderCount(prev => prev + 1);
      };
      
      return (
        <div>
          <h2>Test d'intégration (render #{renderCount})</h2>
          <ModelList components={mockComponents} onDeleteModel={handleDeleteModel} />
          <ClassificationTreeComponent />
        </div>
      );
    }
    
    // Rendu du composant
    const { queryByText, getByText, debug } = render(<TestApp />);
    
    // Vérifier que le message n'apparaît pas initialement (nous avons un modèle)
    expect(queryByText(/Aucun modèle chargé pour afficher la classification/i)).toBeNull();
    
    console.log("=== ÉTAT INITIAL (avec modèle) ===");
    debug();
    
    // Simuler le clic sur le bouton de suppression
    act(() => {
      // Émettre l'événement comme si l'utilisateur cliquait sur le bouton de suppression
      document.dispatchEvent(new CustomEvent('model-delete-requested', {
        detail: { modelId: 'model1' }
      }));
    });
    
    // Faire avancer les timers pour permettre aux effets de se propager
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    console.log("=== APRÈS SUPPRESSION DU MODÈLE ===");
    debug();
    
    // L'état actuel après suppression
    console.log("Modèles restants:", Object.keys(mockFragmentsManager.groups));
    console.log("État du classifier:", mockClassifier.list);
    
    // Vérifier que l'événement de mise à jour a été émis
    const updateEvents = dispatchEventSpy.mock.calls.filter(
      call => call[0]?.type === 'model-classifications-update'
    );
    console.log("Événements de mise à jour émis:", updateEvents.length);
    
    // Ici le test devrait échouer si le message n'apparaît pas
    try {
      expect(getByText(/Aucun modèle chargé pour afficher la classification/i)).toBeInTheDocument();
      console.log("✅ TEST RÉUSSI: Le message s'affiche correctement après la suppression");
    } catch (error) {
      console.log("❌ TEST ÉCHOUÉ: Le message ne s'affiche pas après la suppression");
      console.error(error);
      throw error;
    }
    
    // Cleanup
    jest.useRealTimers();
  });
});