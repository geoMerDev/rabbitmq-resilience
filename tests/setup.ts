/**
 * Global test setup
 * Se ejecuta antes de todos los tests
 */

import { Logs } from '../src/infrastructure/utils/logs';

// Inicializar Logs para tests
Logs.config = {
  log: false,    // Silenciar en tests
  error: false,  // Silenciar en tests
  warn: false,
  info: false,
  debug: false,
  trace: false,
  time: false,
};

// Mock de console para tests limpios (opcional)
global.console = {
  ...console,
  // Silenciar logs en tests (descomenta si quieres logs)
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Configuración global de timeouts
jest.setTimeout(30000);

// Variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || '3306';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'rabbitmq_resilience_test';
process.env.DB_USERNAME = process.env.TEST_DB_USERNAME || 'test';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'test';

process.env.RABBIT_HOSTNAME = process.env.TEST_RABBIT_HOST || 'localhost';
process.env.RABBIT_PORT = process.env.TEST_RABBIT_PORT || '5672';
process.env.RABBIT_USERNAME = process.env.TEST_RABBIT_USERNAME || 'guest';
process.env.RABBIT_PASSWORD = process.env.TEST_RABBIT_PASSWORD || 'guest';

// Cleanup global después de todos los tests
afterAll(async () => {
  // Dar tiempo para cerrar conexiones
  await new Promise(resolve => setTimeout(resolve, 1000));
});
