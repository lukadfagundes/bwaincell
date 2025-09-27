module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    '<rootDir>/src',
    '<rootDir>/tests',
    '<rootDir>/commands',
    '<rootDir>/database',
    '<rootDir>/utils',
  ],
  testMatch: ['**/*.test.ts', '**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    'commands/**/*.ts',
    'database/**/*.ts',
    'utils/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.test.ts',
    '!tests/**',
  ],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@database/(.*)$': '<rootDir>/database/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@commands/(.*)$': '<rootDir>/commands/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 25,
      statements: 25,
    },
  },
  testTimeout: 10000,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowJs: true,
          moduleResolution: 'node',
          isolatedModules: true,
        },
      },
    ],
  },
};
