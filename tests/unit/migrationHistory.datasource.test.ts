/**
 * Tests unitarios completos para MigrationHistoryDatasourceImpl
 * Coverage: 100% para el método createMigrationHistory
 */

import { MigrationHistoryDatasourceImpl } from '@/infrastructure/datasources/eventManager/migrationHistory.datasource.impl';
import { MigrationHistorySequelize } from '@/infrastructure/database/models/eventManager/MigrationHistory';
import { MigrationHistoryEntity } from '@/domain/entities/eventManager/migrationHistory.entity';
import { Logs } from '@/infrastructure/utils/logs';

describe('MigrationHistoryDatasourceImpl', () => {
  let datasource: MigrationHistoryDatasourceImpl;

  beforeEach(() => {
    datasource = new MigrationHistoryDatasourceImpl();
    jest.clearAllMocks();
  });

  describe('createMigrationHistory', () => {
    it('should create a new migration history successfully', async () => {
      // Arrange
      const name = 'initial-migration';
      const server = 'server-1';
      const now = new Date();

      const mockModel = {
        id: 1,
        name,
        server,
        createdAt: now,
        updatedAt: now,
      } as any;

      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockResolvedValue(mockModel);
      jest.spyOn(MigrationHistoryEntity, 'fromRow').mockReturnValue(
        new MigrationHistoryEntity(1, name, server, now, now, null as any)
      );

      // Act
      const result = await datasource.createMigrationHistory(name, server);

      // Assert
      expect(result).toBeInstanceOf(MigrationHistoryEntity);
      expect(result.id).toBe(1);
      expect(result.name).toBe(name);
      expect(result.server).toBe(server);
      expect(MigrationHistorySequelize.create).toHaveBeenCalledWith({
        name,
        server,
      });
    });

    it('should create migration history with different name and server values', async () => {
      // Arrange
      const testCases = [
        { name: 'migration-1', server: 'prod' },
        { name: 'migration-2', server: 'staging' },
        { name: 'migration-3', server: 'dev' },
      ];

      for (const testCase of testCases) {
        const mockModel = {
          id: 1,
          name: testCase.name,
          server: testCase.server,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;

        jest
          .spyOn(MigrationHistorySequelize, 'create')
          .mockResolvedValueOnce(mockModel);
        jest.spyOn(MigrationHistoryEntity, 'fromRow').mockReturnValueOnce(
          new MigrationHistoryEntity(1, testCase.name, testCase.server, new Date(), new Date(), null as any)
        );

        // Act
        const result = await datasource.createMigrationHistory(
          testCase.name,
          testCase.server
        );

        // Assert
        expect(result.name).toBe(testCase.name);
        expect(result.server).toBe(testCase.server);
      }
    });

    it('should throw error when name is empty', async () => {
      // Act & Assert
      await expect(
        datasource.createMigrationHistory('', 'server-1')
      ).rejects.toThrow('Failed to create migration history.');
    });

    it('should throw error when server is empty', async () => {
      // Act & Assert
      await expect(
        datasource.createMigrationHistory('migration-1', '')
      ).rejects.toThrow('Failed to create migration history.');
    });

    it('should throw error when both name and server are empty', async () => {
      // Act & Assert
      await expect(
        datasource.createMigrationHistory('', '')
      ).rejects.toThrow('Failed to create migration history.');
    });

    it('should throw error when name is null', async () => {
      // Act & Assert
      await expect(
        datasource.createMigrationHistory(null as any, 'server-1')
      ).rejects.toThrow('Failed to create migration history.');
    });

    it('should throw error when server is null', async () => {
      // Act & Assert
      await expect(
        datasource.createMigrationHistory('migration-1', null as any)
      ).rejects.toThrow('Failed to create migration history.');
    });

    it('should throw error when name is undefined', async () => {
      // Act & Assert
      await expect(
        datasource.createMigrationHistory(undefined as any, 'server-1')
      ).rejects.toThrow('Failed to create migration history.');
    });

    it('should throw error when server is undefined', async () => {
      // Act & Assert
      await expect(
        datasource.createMigrationHistory('migration-1', undefined as any)
      ).rejects.toThrow('Failed to create migration history.');
    });

    it('should catch Sequelize errors and throw generic error', async () => {
      // Arrange
      const sequelizeError = new Error('Unique constraint failed');
      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockRejectedValue(sequelizeError);
      jest.spyOn(Logs, 'error').mockImplementation();

      // Act & Assert
      await expect(
        datasource.createMigrationHistory('migration-1', 'server-1')
      ).rejects.toThrow('Failed to create migration history.');

      // Verify Logs.error was called
      expect(Logs.error).toHaveBeenCalledWith(
        'Error creating migration history:',
        sequelizeError
      );
    });

    it('should log error when Sequelize fails', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockRejectedValue(error);
      const logSpy = jest.spyOn(Logs, 'error').mockImplementation();

      // Act
      try {
        await datasource.createMigrationHistory('migration-1', 'server-1');
      } catch (e) {
        // Expected error
      }

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        'Error creating migration history:',
        error
      );
    });

    it('should handle name with special characters', async () => {
      // Arrange
      const name = 'migration-@#$%^&*()_+-=[]{}|;:,.<>?';
      const server = 'server-1';
      const now = new Date();

      const mockModel = {
        id: 1,
        name,
        server,
        createdAt: now,
        updatedAt: now,
      } as any;

      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockResolvedValue(mockModel);
      jest.spyOn(MigrationHistoryEntity, 'fromRow').mockReturnValue(
        new MigrationHistoryEntity(1, name, server, now, now, null as any)
      );

      // Act
      const result = await datasource.createMigrationHistory(name, server);

      // Assert
      expect(result.name).toBe(name);
      expect(MigrationHistorySequelize.create).toHaveBeenCalledWith({
        name,
        server,
      });
    });

    it('should handle server with special characters', async () => {
      // Arrange
      const name = 'migration-1';
      const server = 'server-@#$%^&*()_+-=[]{}|;:,.<>?';
      const now = new Date();

      const mockModel = {
        id: 1,
        name,
        server,
        createdAt: now,
        updatedAt: now,
      } as any;

      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockResolvedValue(mockModel);
      jest.spyOn(MigrationHistoryEntity, 'fromRow').mockReturnValue(
        new MigrationHistoryEntity(1, name, server, now, now, null as any)
      );

      // Act
      const result = await datasource.createMigrationHistory(name, server);

      // Assert
      expect(result.server).toBe(server);
    });

    it('should handle very long name', async () => {
      // Arrange
      const name = 'a'.repeat(1000);
      const server = 'server-1';
      const now = new Date();

      const mockModel = {
        id: 1,
        name,
        server,
        createdAt: now,
        updatedAt: now,
      } as any;

      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockResolvedValue(mockModel);
      jest.spyOn(MigrationHistoryEntity, 'fromRow').mockReturnValue(
        new MigrationHistoryEntity(1, name, server, now, now, null as any)
      );

      // Act
      const result = await datasource.createMigrationHistory(name, server);

      // Assert
      expect(result.name).toHaveLength(1000);
    });

    it('should handle very long server', async () => {
      // Arrange
      const name = 'migration-1';
      const server = 'b'.repeat(1000);
      const now = new Date();

      const mockModel = {
        id: 1,
        name,
        server,
        createdAt: now,
        updatedAt: now,
      } as any;

      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockResolvedValue(mockModel);
      jest.spyOn(MigrationHistoryEntity, 'fromRow').mockReturnValue(
        new MigrationHistoryEntity(1, name, server, now, now, null as any)
      );

      // Act
      const result = await datasource.createMigrationHistory(name, server);

      // Assert
      expect(result.server).toHaveLength(1000);
    });

    it('should correctly map Sequelize model to MigrationHistoryEntity', async () => {
      // Arrange
      const name = 'test-migration';
      const server = 'test-server';
      const now = new Date();
      const id = 42;

      const mockModel = {
        id,
        name,
        server,
        createdAt: now,
        updatedAt: now,
      } as any;

      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockResolvedValue(mockModel);

      const expectedEntity = new MigrationHistoryEntity(id, name, server, now, now, null as any);
      const fromRowSpy = jest
        .spyOn(MigrationHistoryEntity, 'fromRow')
        .mockReturnValue(expectedEntity);

      // Act
      const result = await datasource.createMigrationHistory(name, server);

      // Assert
      expect(fromRowSpy).toHaveBeenCalledWith(mockModel);
      expect(result).toEqual(expectedEntity);
    });

    it('should preserve entity properties after creation', async () => {
      // Arrange
      const name = 'preserve-test';
      const server = 'preserve-server';
      const now = new Date();
      const id = 99;

      const mockModel = {
        id,
        name,
        server,
        createdAt: now,
        updatedAt: now,
      } as any;

      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockResolvedValue(mockModel);
      jest.spyOn(MigrationHistoryEntity, 'fromRow').mockReturnValue(
        new MigrationHistoryEntity(id, name, server, now, now, null as any)
      );

      // Act
      const result = await datasource.createMigrationHistory(name, server);

      // Assert
      expect(result.id).toBe(id);
      expect(result.name).toBe(name);
      expect(result.server).toBe(server);
      expect(result.createdAt).toBe(now);
      expect(result.updatedAt).toBe(now);
    });

    it('should call Sequelize.create with correct parameters', async () => {
      // Arrange
      const name = 'param-test';
      const server = 'param-server';

      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockResolvedValue({} as any);
      jest
        .spyOn(MigrationHistoryEntity, 'fromRow')
        .mockReturnValue({} as any);

      // Act
      await datasource.createMigrationHistory(name, server);

      // Assert
      expect(MigrationHistorySequelize.create).toHaveBeenCalledWith({
        name,
        server,
      });
      expect(MigrationHistorySequelize.create).toHaveBeenCalledTimes(1);
    });

    it('should handle different error types from Sequelize', async () => {
      // Arrange
      const testErrors = [
        new Error('Connection refused'),
        new Error('Duplicate entry'),
        new Error('Query timeout'),
      ];

      jest.spyOn(Logs, 'error').mockImplementation();

      for (const error of testErrors) {
        jest
          .spyOn(MigrationHistorySequelize, 'create')
          .mockRejectedValueOnce(error);

        // Act & Assert
        await expect(
          datasource.createMigrationHistory('migration', 'server')
        ).rejects.toThrow('Failed to create migration history.');
      }
    });

    it('should return entity instance for successful creation', async () => {
      // Arrange
      const name = 'instance-test';
      const server = 'instance-server';
      const now = new Date();

      const mockModel = {
        id: 1,
        name,
        server,
        createdAt: now,
        updatedAt: now,
      } as any;

      jest
        .spyOn(MigrationHistorySequelize, 'create')
        .mockResolvedValue(mockModel);

      const entity = new MigrationHistoryEntity(1, name, server, now, now, null as any);
      jest
        .spyOn(MigrationHistoryEntity, 'fromRow')
        .mockReturnValue(entity);

      // Act
      const result = await datasource.createMigrationHistory(name, server);

      // Assert
      expect(result).toBeInstanceOf(MigrationHistoryEntity);
      expect(result).toBe(entity);
    });
  });
});
