module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src', '<rootDir>/scripts'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  clearMocks: true,
  collectCoverageFrom: ['src/engine/**/*.ts', '!src/engine/**/__tests__/**'],
  coverageThreshold: {
    './src/engine/': { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
};
