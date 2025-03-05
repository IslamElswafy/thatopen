// Mock pour ui-obc
const tables = {
  modelsList: jest.fn(() => {
    const element = document.createElement('div');
    const api = { updateTable: jest.fn() };
    return [element, api];
  }),
  classificationTree: jest.fn(() => {
    const element = document.createElement('div');
    return [element];
  })
};

module.exports = {
  tables
};