export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  moduleNameMapper: {
    '^@thatopen/components$': '<rootDir>/src/__mocks__/@thatopen/components.js',
    '^@thatopen/ui-obc$': '<rootDir>/src/__mocks__/@thatopen/ui-obc.js'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@thatopen)/)'
  ]
};