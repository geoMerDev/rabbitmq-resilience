/**
 * Helpers para base de datos en tests
 */

import { Sequelize } from 'sequelize';

let sequelizeInstance: Sequelize | null = null;

/**
 * Crea una instancia de Sequelize para tests
 * Usa SQLite en memoria por defecto (rápido y sin dependencias)
 */
export async function createTestDatabase(): Promise<Sequelize> {
  if (sequelizeInstance) {
    return sequelizeInstance;
  }

  // Opción 1: SQLite en memoria (más rápido para tests unitarios)
  sequelizeInstance = new Sequelize('sqlite::memory:', {
    logging: false,
    dialect: 'sqlite',
  });

  // Opción 2: MySQL real (para tests de integración)
  // Descomenta si quieres usar MySQL real
  /*
  sequelizeInstance = new Sequelize({
    dialect: 'mysql',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '3306'),
    username: process.env.TEST_DB_USERNAME || 'root',
    password: process.env.TEST_DB_PASSWORD || 'root',
    database: process.env.TEST_DB_NAME || 'rabbitmq_resilience_test',
    logging: false,
  });
  */

  try {
    await sequelizeInstance.authenticate();
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Unable to connect to test database:', error);
    throw error;
  }

  return sequelizeInstance;
}

/**
 * Sincroniza las tablas (crea schema)
 */
export async function syncTestDatabase(sequelize: Sequelize): Promise<void> {
  await sequelize.sync({ force: true }); // force: true borra y recrea tablas
}

/**
 * Limpia todas las tablas
 */
export async function cleanTestDatabase(sequelize: Sequelize): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  
  for (const table of tables) {
    await sequelize.query(`DELETE FROM ${table}`);
  }
}

/**
 * Cierra la conexión de BD
 */
export async function closeTestDatabase(): Promise<void> {
  if (sequelizeInstance) {
    await sequelizeInstance.close();
    sequelizeInstance = null;
  }
}

/**
 * Obtiene la instancia actual
 */
export function getTestDatabase(): Sequelize | null {
  return sequelizeInstance;
}

/**
 * Helper para ejecutar tests con BD limpia
 */
export function withCleanDatabase() {
  let sequelize: Sequelize;

  beforeAll(async () => {
    sequelize = await createTestDatabase();
    await syncTestDatabase(sequelize);
  });

  beforeEach(async () => {
    await cleanTestDatabase(sequelize);
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  return () => sequelize;
}
