/**
 * Tests unitarios completos para EventProcessLogDatasourceImpl
 * Coverage: mapToEntity (líneas 9-17) - 100% cubierto
 *          + createEventProcessLog, getEventProcessLogById, getEventProcessLogByEventId (con mocks)
 * 
 * Nota: Los tests con BD se pueden agregar en integración si es necesario
 */

import { EventProcessLogDatasourceImpl } from '@/infrastructure/datasources/eventManager/eventProcessLog.datasource.impl';
import { EventProcessLogEntity } from '@/domain/entities/eventManager';
import { EventProcessLogSequelize } from '@/infrastructure/database/models/eventManager';
import { EventProcessLogDto } from '@/domain/dtos/eventManager';

describe('EventProcessLogDatasourceImpl', () => {
  let datasource: EventProcessLogDatasourceImpl;

  beforeEach(() => {
    datasource = new EventProcessLogDatasourceImpl();
  });


  describe('mapToEntity', () => {
    it('should map a Sequelize model to EventProcessLogEntity', () => {
      // Arrange
      const now = new Date();
      const sequelizeModel = {
        id: 1,
        eventId: 100,
        processName: 'process1',
        duration: 1500,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity.id).toBe(1);
      expect(entity.eventId).toBe(100);
      expect(entity.processName).toBe('process1');
      expect(entity.duration).toBe(1500);
      expect(entity.createdAt).toBe(now);
      expect(entity.updatedAt).toBe(now);
      expect(entity.deletedAt).toBeNull();
    });

    it('should map a model with deleted date', () => {
      // Arrange
      const now = new Date();
      const deleted = new Date(now.getTime() + 1000);
      const sequelizeModel = {
        id: 2,
        eventId: 200,
        processName: 'process2',
        duration: 2000,
        createdAt: now,
        updatedAt: now,
        deletedAt: deleted,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity.deletedAt).toBe(deleted);
    });

    it('should preserve all properties correctly', () => {
      // Arrange
      const now = new Date();
      const sequelizeModel = {
        id: 999,
        eventId: 42,
        processName: 'complexProcessName',
        duration: 5000,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity).toEqual({
        id: 999,
        eventId: 42,
        processName: 'complexProcessName',
        duration: 5000,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    });

    it('should handle zero duration', () => {
      // Arrange
      const sequelizeModel = {
        id: 1,
        eventId: 100,
        processName: 'instant',
        duration: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity.duration).toBe(0);
    });

    it('should handle undefined duration', () => {
      // Arrange
      const sequelizeModel = {
        id: 1,
        eventId: 100,
        processName: 'process',
        duration: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity.duration).toBeUndefined();
    });

    it('should return EventProcessLogEntity instance', () => {
      // Arrange
      const sequelizeModel = {
        id: 5,
        eventId: 50,
        processName: 'test',
        duration: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity).toBeInstanceOf(EventProcessLogEntity);
    });

    it('should handle large eventId', () => {
      // Arrange
      const sequelizeModel = {
        id: 1,
        eventId: 999999999,
        processName: 'process',
        duration: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity.eventId).toBe(999999999);
    });

    it('should handle negative duration', () => {
      // Arrange
      const sequelizeModel = {
        id: 1,
        eventId: 100,
        processName: 'process',
        duration: -1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity.duration).toBe(-1000);
    });

    it('should handle large duration values', () => {
      // Arrange
      const largeDuration = 999999999;
      const sequelizeModel = {
        id: 1,
        eventId: 100,
        processName: 'long-process',
        duration: largeDuration,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity.duration).toBe(largeDuration);
    });

    it('should preserve process name with special characters', () => {
      // Arrange
      const specialName = 'process@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';
      const sequelizeModel = {
        id: 1,
        eventId: 50,
        processName: specialName,
        duration: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity.processName).toBe(specialName);
    });

    it('should preserve very long process name', () => {
      // Arrange
      const longName = 'a'.repeat(1000);
      const sequelizeModel = {
        id: 1,
        eventId: 100,
        processName: longName,
        duration: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity.processName).toBe(longName);
    });

    it('should handle timestamps', () => {
      // Arrange
      const created = new Date('2024-01-01T10:00:00Z');
      const updated = new Date('2024-01-02T10:00:00Z');
      const deleted = new Date('2024-01-03T10:00:00Z');
      const sequelizeModel = {
        id: 1,
        eventId: 100,
        processName: 'process',
        duration: 100,
        createdAt: created,
        updatedAt: updated,
        deletedAt: deleted,
      } as any;

      // Act
      const entity = datasource.mapToEntity(sequelizeModel);

      // Assert
      expect(entity.createdAt).toBe(created);
      expect(entity.updatedAt).toBe(updated);
      expect(entity.deletedAt).toBe(deleted);
    });

    it('should map model with different id values', () => {
      // Arrange
      for (let i = 1; i <= 5; i++) {
        const sequelizeModel = {
          id: i,
          eventId: i * 10,
          processName: `process${i}`,
          duration: i * 100,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        } as any;

        // Act
        const entity = datasource.mapToEntity(sequelizeModel);

        // Assert
        expect(entity.id).toBe(i);
        expect(entity.eventId).toBe(i * 10);
        expect(entity.processName).toBe(`process${i}`);
        expect(entity.duration).toBe(i * 100);
      }
    });
  });

  describe('createEventProcessLog', () => {
    it('should create an EventProcessLog and return the mapped entity', async () => {
      // Arrange
      const [errors, dto] = EventProcessLogDto.create({ eventId: 1, processName: 'test' });
      expect(dto).toBeDefined();
      expect(errors).toHaveLength(0);

      const now = new Date();
      const createdModel = {
        id: 1,
        eventId: dto!.eventId,
        processName: dto!.processName,
        duration: dto!.duration,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      jest.spyOn(EventProcessLogSequelize, 'create').mockResolvedValue(createdModel);

      // Act
      const result = await datasource.createEventProcessLog(dto!);

      // Assert
      expect(result.id).toBe(1);
      expect(result.eventId).toBe(dto!.eventId);
      expect(result.processName).toBe(dto!.processName);
      expect(EventProcessLogSequelize.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: dto!.eventId,
          processName: dto!.processName,
        })
      );
    });

    it('should handle dto with duration', async () => {
      // Arrange
      const [errors, dto] = EventProcessLogDto.create({ eventId: 2, processName: 'test2', duration: 1500 });
      expect(dto).toBeDefined();
      expect(errors).toHaveLength(0);

      const now = new Date();
      const createdModel = {
        id: 2,
        eventId: dto!.eventId,
        processName: dto!.processName,
        duration: 1500,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      jest.spyOn(EventProcessLogSequelize, 'create').mockResolvedValue(createdModel);

      // Act
      const result = await datasource.createEventProcessLog(dto!);

      // Assert
      expect(result.duration).toBe(1500);
      expect(EventProcessLogSequelize.create).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 1500,
        })
      );
    });

    it('should throw error if Sequelize create fails', async () => {
      // Arrange
      const [errors, dto] = EventProcessLogDto.create({ eventId: 1, processName: 'test' });
      expect(dto).toBeDefined();
      const error = new Error('Database error');

      jest.spyOn(EventProcessLogSequelize, 'create').mockRejectedValue(error);

      // Act & Assert
      await expect(datasource.createEventProcessLog(dto!)).rejects.toThrow('Database error');
    });
  });

  describe('getEventProcessLogById', () => {
    it('should return EventProcessLog entity by id', async () => {
      // Arrange
      const now = new Date();
      const model = {
        id: 1,
        eventId: 100,
        processName: 'process1',
        duration: 1000,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      jest.spyOn(EventProcessLogSequelize, 'findByPk').mockResolvedValue(model);

      // Act
      const result = await datasource.getEventProcessLogById(1);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.eventId).toBe(100);
      expect(result?.processName).toBe('process1');
      expect(EventProcessLogSequelize.findByPk).toHaveBeenCalledWith(1);
    });

    it('should return null if EventProcessLog not found', async () => {
      // Arrange
      jest.spyOn(EventProcessLogSequelize, 'findByPk').mockResolvedValue(null);

      // Act
      const result = await datasource.getEventProcessLogById(999);

      // Assert
      expect(result).toBeNull();
      expect(EventProcessLogSequelize.findByPk).toHaveBeenCalledWith(999);
    });

    it('should throw error if query fails', async () => {
      // Arrange
      const error = new Error('Query failed');
      jest.spyOn(EventProcessLogSequelize, 'findByPk').mockRejectedValue(error);

      // Act & Assert
      await expect(datasource.getEventProcessLogById(1)).rejects.toThrow('Query failed');
    });

    it('should correctly map the returned model to entity', async () => {
      // Arrange
      const now = new Date();
      const model = {
        id: 5,
        eventId: 555,
        processName: 'complexProcess',
        duration: 5555,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      jest.spyOn(EventProcessLogSequelize, 'findByPk').mockResolvedValue(model);

      // Act
      const result = await datasource.getEventProcessLogById(5);

      // Assert
      expect(result).toEqual({
        id: 5,
        eventId: 555,
        processName: 'complexProcess',
        duration: 5555,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    });
  });

  describe('getEventProcessLogByEventId', () => {
    it('should return array of EventProcessLog entities by eventId', async () => {
      // Arrange
      const now = new Date();
      const models = [
        {
          id: 1,
          eventId: 100,
          processName: 'process1',
          duration: 1000,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
        {
          id: 2,
          eventId: 100,
          processName: 'process2',
          duration: 2000,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ] as any;

      jest.spyOn(EventProcessLogSequelize, 'findAll').mockResolvedValue(models);

      // Act
      const result = await datasource.getEventProcessLogByEventId(100);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].eventId).toBe(100);
      expect(result[1].id).toBe(2);
      expect(result[1].eventId).toBe(100);
      expect(EventProcessLogSequelize.findAll).toHaveBeenCalledWith({
        where: { eventId: 100 },
      });
    });

    it('should return empty array if no EventProcessLogs found', async () => {
      // Arrange
      jest.spyOn(EventProcessLogSequelize, 'findAll').mockResolvedValue([]);

      // Act
      const result = await datasource.getEventProcessLogByEventId(999);

      // Assert
      expect(result).toEqual([]);
      expect(EventProcessLogSequelize.findAll).toHaveBeenCalledWith({
        where: { eventId: 999 },
      });
    });

    it('should correctly map all returned models to entities', async () => {
      // Arrange
      const now = new Date();
      const models = [
        {
          id: 10,
          eventId: 50,
          processName: 'proc1',
          duration: 100,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
        {
          id: 11,
          eventId: 50,
          processName: 'proc2',
          duration: 200,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ] as any;

      jest.spyOn(EventProcessLogSequelize, 'findAll').mockResolvedValue(models);

      // Act
      const result = await datasource.getEventProcessLogByEventId(50);

      // Assert
      expect(result).toHaveLength(2);
      result.forEach((entity, index) => {
        expect(entity).toEqual(models[index]);
      });
    });

    it('should throw error if query fails', async () => {
      // Arrange
      const error = new Error('Database error');
      jest.spyOn(EventProcessLogSequelize, 'findAll').mockRejectedValue(error);

      // Act & Assert
      await expect(datasource.getEventProcessLogByEventId(100)).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle multiple process logs with different durations', async () => {
      // Arrange
      const now = new Date();
      const models = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        eventId: 200,
        processName: `process${i + 1}`,
        duration: (i + 1) * 100,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      })) as any;

      jest.spyOn(EventProcessLogSequelize, 'findAll').mockResolvedValue(models);

      // Act
      const result = await datasource.getEventProcessLogByEventId(200);

      // Assert
      expect(result).toHaveLength(5);
      result.forEach((entity, index) => {
        expect(entity.id).toBe(index + 1);
        expect(entity.duration).toBe((index + 1) * 100);
      });
    });
  });
});
