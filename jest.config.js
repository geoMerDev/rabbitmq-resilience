module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  modulePaths: ['<rootDir>'],
  
  // COVERAGE OPTIMIZADO
  collectCoverageFrom: [
    // ✅ Incluir (código crítico de negocio)
    'src/domain/dtos/**/*.ts',
    'src/infrastructure/datasources/**/*.impl.ts',
    'src/infrastructure/eventManager/eventResilienceHandler.ts',
    'src/infrastructure/eventManager/eventException.ts',
    'src/infrastructure/eventManager/createEventList.ts',
    'src/infrastructure/utils/logs.ts',
    
    // ❌ Excluir específicamente
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/domain/entities/**/*',
    '!src/infrastructure/database/models/**/*',
    '!src/infrastructure/database/init.ts',
    '!src/infrastructure/database/hook.ts',
    '!src/infrastructure/email/**/*',
    '!src/infrastructure/socket/**/*',
    '!src/infrastructure/repositories/**/*',
    '!src/infrastructure/eventManager/rabbitmq.ts',
    '!src/infrastructure/eventManager/rabbitMQResilience.ts',
    '!src/infrastructure/eventManager/config.ts',
    '!src/presentation/**/*',
    '!src/infrastructure/utils/template/**/*',
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
  
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
};
