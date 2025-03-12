// Mock simplifié de @thatopen/components
const Components = function() {
  return {
    get: jest.fn(),
    onDisposed: { add: jest.fn(), remove: jest.fn() },
    list: new Map(),
    enabled: true
  };
};

// Constantes utilisées dans les tests
const FragmentsManager = 'FragmentsManager';
const IfcLoader = 'IfcLoader';
const Raycasters = 'Raycasters';
const SimpleClipper = 'SimpleClipper';
const Classifier = 'Classifier';

module.exports = {
  Components,
  FragmentsManager,
  IfcLoader,
  Raycasters,
  SimpleClipper,
  Classifier
};