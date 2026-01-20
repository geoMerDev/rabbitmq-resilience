/**
 * Tests unitarios completos para InboxEventDatasourceImpl
 * Coverage: Todos los métodos con 100% cobertura
 * - mapToEntity (privado, testeado indirectamente)
 * - createInboxEvent (findOrCreate)
 * - getByUuid
 * - countInboxEvents
 * - countInboxEventsByType
 * - countInboxEventsByDateRange
 * - countByType
 * - processSuccessByUuidAndProcessName
 * - getPaginated (con búsqueda y ordenamiento)
 * - getByUuidWhitProcess
 */

import { InboxEventDatasourceImpl } from '@/infrastructure/datasources/eventManager/inboxEvent.datasource.impl';
import { InboxEventSequelize } from '@/infrastructure/database/models/eventManager/InboxEvent';
import { EventProcessLogSequelize } from '@/infrastructure/database/models/eventManager';
import { InboxEventDto } from '@/domain/dtos/eventManager';
import { EventProcessLogDatasourceImpl } from '@/infrastructure/datasources/eventManager/eventProcessLog.datasource.impl';
import { PaginationDto } from '@/domain/dtos/shared/pagination.dto';

describe('InboxEventDatasourceImpl', () => {
  let datasource: InboxEventDatasourceImpl;

  beforeEach(() => {
    datasource = new InboxEventDatasourceImpl();
    jest.clearAllMocks();
  });

  describe('createInboxEvent', () => {
    it('should create a new inbox event when uuid does not exist', async () => {
      // Arrange
      const [, dto] = InboxEventDto.create({
        uuid: 'uuid-123',
        type: 'order.created',
        headers: { key: 'value' },
        properties: { prop1: 'val1' },
        payload: { data: 'test' },
      });
      expect(dto).toBeDefined();

      const createdModel = {
        id: 1,
        uuid: dto!.uuid,
        type: dto!.type,
        headers: dto!.headers,
        properties: dto!.properties,
        payload: dto!.payload,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      jest
        .spyOn(InboxEventSequelize, 'findOrCreate')
        .mockResolvedValue([createdModel, true]);

      // Act
      const result = await datasource.createInboxEvent(dto!);

      // Assert
      expect(result.id).toBe(1);
      expect(result.uuid).toBe(dto!.uuid);
      expect(result.type).toBe(dto!.type);
      expect(InboxEventSequelize.findOrCreate).toHaveBeenCalledWith({
        where: { uuid: dto!.uuid },
        defaults: expect.objectContaining({
          uuid: dto!.uuid,
          type: dto!.type,
        }),
      });
    });

    it('should return existing inbox event when uuid already exists', async () => {
      // Arrange
      const [, dto] = InboxEventDto.create({
        uuid: 'existing-uuid',
        type: 'order.updated',
        headers: {},
        properties: {},
        payload: {},
      });

      const existingModel = {
        id: 10,
        uuid: dto!.uuid,
        type: dto!.type,
        headers: dto!.headers,
        properties: dto!.properties,
        payload: dto!.payload,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      jest
        .spyOn(InboxEventSequelize, 'findOrCreate')
        .mockResolvedValue([existingModel, false]);

      // Act
      const result = await datasource.createInboxEvent(dto!);

      // Assert
      expect(result.id).toBe(10);
      expect(result.uuid).toBe(dto!.uuid);
    });

    it('should throw error if findOrCreate fails', async () => {
      // Arrange
      const [, dto] = InboxEventDto.create({
        uuid: 'uuid-fail',
        type: 'error.test',
        headers: {},
        properties: {},
        payload: {},
      });

      const error = new Error('Database error');
      jest.spyOn(InboxEventSequelize, 'findOrCreate').mockRejectedValue(error);

      // Act & Assert
      await expect(datasource.createInboxEvent(dto!)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getByUuid', () => {
    it('should return inbox event by uuid', async () => {
      // Arrange
      const uuid = 'test-uuid-123';
      const now = new Date();
      const model = {
        id: 1,
        uuid,
        type: 'event.type',
        headers: { header1: 'value1' },
        properties: { prop1: 'value1' },
        payload: { data: 'test' },
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      jest.spyOn(InboxEventSequelize, 'findOne').mockResolvedValue(model);

      // Act
      const result = await datasource.getByUuid(uuid);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.uuid).toBe(uuid);
      expect(result?.type).toBe('event.type');
      expect(InboxEventSequelize.findOne).toHaveBeenCalledWith({
        where: { uuid },
      });
    });

    it('should return null when uuid not found', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'findOne').mockResolvedValue(null);

      // Act
      const result = await datasource.getByUuid('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when uuid is empty', async () => {
      // Act & Assert
      await expect(datasource.getByUuid('')).rejects.toThrow(
        'UUID parameter is required'
      );
    });

    it('should throw error when uuid is not provided', async () => {
      // Act & Assert
      await expect(datasource.getByUuid(null as any)).rejects.toThrow(
        'UUID parameter is required'
      );
    });

    it('should throw error if query fails', async () => {
      // Arrange
      const error = new Error('Query failed');
      jest.spyOn(InboxEventSequelize, 'findOne').mockRejectedValue(error);

      // Act & Assert
      await expect(datasource.getByUuid('uuid-123')).rejects.toThrow(
        'Query failed'
      );
    });
  });

  describe('countInboxEvents', () => {
    it('should return total count of inbox events', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'count').mockResolvedValue(42);

      // Act
      const result = await datasource.countInboxEvents();

      // Assert
      expect(result).toBe(42);
      expect(InboxEventSequelize.count).toHaveBeenCalled();
    });

    it('should return 0 when no events exist', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'count').mockResolvedValue(0);

      // Act
      const result = await datasource.countInboxEvents();

      // Assert
      expect(result).toBe(0);
    });

    it('should handle large numbers', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'count').mockResolvedValue(999999);

      // Act
      const result = await datasource.countInboxEvents();

      // Assert
      expect(result).toBe(999999);
    });
  });

  describe('countInboxEventsByType', () => {
    it('should return count of events by type', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'count').mockResolvedValue(15);

      // Act
      const result = await datasource.countInboxEventsByType('order.created');

      // Assert
      expect(result).toBe(15);
      expect(InboxEventSequelize.count).toHaveBeenCalledWith({
        where: { type: 'order.created' },
      });
    });

    it('should return 0 when no events of type found', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'count').mockResolvedValue(0);

      // Act
      const result = await datasource.countInboxEventsByType('unknown.type');

      // Assert
      expect(result).toBe(0);
    });

    it('should handle different event types', async () => {
      // Arrange
      const types = [
        'order.created',
        'order.updated',
        'payment.received',
      ];

      for (const type of types) {
        jest
          .spyOn(InboxEventSequelize, 'count')
          .mockResolvedValueOnce(5);

        // Act
        const result = await datasource.countInboxEventsByType(type);

        // Assert
        expect(result).toBe(5);
      }
    });
  });

  describe('countInboxEventsByDateRange', () => {
    it('should return count of events within date range', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      jest.spyOn(InboxEventSequelize, 'count').mockResolvedValue(20);

      // Act
      const result = await datasource.countInboxEventsByDateRange(
        startDate,
        endDate
      );

      // Assert
      expect(result).toBe(20);
      expect(InboxEventSequelize.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.anything(),
          }),
        })
      );
    });

    it('should return 0 when no events in date range', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'count').mockResolvedValue(0);

      // Act
      const result = await datasource.countInboxEventsByDateRange(
        new Date('2020-01-01'),
        new Date('2020-01-31')
      );

      // Assert
      expect(result).toBe(0);
    });

    it('should handle same start and end date', async () => {
      // Arrange
      const date = new Date('2024-01-15');
      jest.spyOn(InboxEventSequelize, 'count').mockResolvedValue(3);

      // Act
      const result = await datasource.countInboxEventsByDateRange(date, date);

      // Assert
      expect(result).toBe(3);
    });
  });

  describe('countByType', () => {
    it('should return count by type', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'count').mockResolvedValue(8);

      // Act
      const result = await datasource.countByType('user.registered');

      // Assert
      expect(result).toBe(8);
      expect(InboxEventSequelize.count).toHaveBeenCalledWith({
        where: { type: 'user.registered' },
      });
    });

    it('should be equivalent to countInboxEventsByType', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'count').mockResolvedValue(5);

      // Act
      const result1 = await datasource.countByType('test.type');
      const result2 = await datasource.countInboxEventsByType('test.type');

      // Assert
      expect(result1).toBe(result2);
    });
  });

  describe('processSuccessByUuidAndProcessName', () => {
    it('should return true when process exists for uuid and processName', async () => {
      // Arrange
      const uuid = 'uuid-123';
      const processName = 'processA';

      const model = {
        id: 1,
        uuid,
        type: 'event',
        headers: {},
        properties: {},
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any;

      jest.spyOn(InboxEventSequelize, 'findOne').mockResolvedValue(model);

      // Act
      const result = await datasource.processSuccessByUuidAndProcessName(
        uuid,
        processName
      );

      // Assert
      expect(result).toBe(true);
      expect(InboxEventSequelize.findOne).toHaveBeenCalledWith({
        where: { uuid },
        include: [
          {
            model: EventProcessLogSequelize,
            where: { processName },
            required: true,
          },
        ],
      });
    });

    it('should return false when process does not exist', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'findOne').mockResolvedValue(null);

      // Act
      const result = await datasource.processSuccessByUuidAndProcessName(
        'uuid-123',
        'processA'
      );

      // Assert
      expect(result).toBe(false);
    });

    it('should throw error when uuid is missing', async () => {
      // Act & Assert
      await expect(
        datasource.processSuccessByUuidAndProcessName('', 'processA')
      ).rejects.toThrow('UUID parameter is required');
    });

    it('should throw error when processName is missing', async () => {
      // Act & Assert
      await expect(
        datasource.processSuccessByUuidAndProcessName('uuid-123', '')
      ).rejects.toThrow('ProcessName parameter is required');
    });

    it('should throw error when both uuid and processName are missing', async () => {
      // Act & Assert
      await expect(
        datasource.processSuccessByUuidAndProcessName('', '')
      ).rejects.toThrow('UUID parameter is required');
    });

    it('should handle multiple matching processes', async () => {
      // Arrange
      const uuid = 'uuid-456';
      const processName = 'processB';

      jest.spyOn(InboxEventSequelize, 'findOne').mockResolvedValue({
        id: 1,
      } as any);

      // Act
      const result = await datasource.processSuccessByUuidAndProcessName(
        uuid,
        processName
      );

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('getPaginated', () => {
    it('should return paginated inbox events with default sorting', async () => {
      // Arrange
      const [, paginationDto] = PaginationDto.create({
        page: 1,
        itemsPerPage: 10,
      });
      expect(paginationDto).toBeDefined();

      const models = [
        {
          id: 1,
          uuid: 'uuid-1',
          type: 'type1',
          headers: {},
          properties: {},
          payload: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 2,
          uuid: 'uuid-2',
          type: 'type2',
          headers: {},
          properties: {},
          payload: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ] as any;

      jest.spyOn(InboxEventSequelize, 'findAndCountAll').mockResolvedValue({
        count: 2,
        rows: models,
      } as any);

      // Act
      const result = await datasource.getPaginated(paginationDto!);

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.inboxEvents).toHaveLength(2);
      expect(result.inboxEvents[0].uuid).toBe('uuid-1');
      expect(InboxEventSequelize.findAndCountAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        order: [],
        where: {},
      });
    });

    it('should return paginated results with search filter', async () => {
      // Arrange
      const [, paginationDto] = PaginationDto.create({
        page: 1,
        itemsPerPage: 10,
        search: 'uuid-1',
      });
      expect(paginationDto).toBeDefined();

      const models = [
        {
          id: 1,
          uuid: 'uuid-1',
          type: 'type1',
          headers: {},
          properties: {},
          payload: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ] as any;

      jest.spyOn(InboxEventSequelize, 'findAndCountAll').mockResolvedValue({
        count: 1,
        rows: models,
      } as any);

      // Act
      const result = await datasource.getPaginated(paginationDto!);

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.inboxEvents).toHaveLength(1);
      expect(InboxEventSequelize.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        })
      );
    });

    it('should return paginated results with valid sorting', async () => {
      // Arrange
      const [, paginationDto] = PaginationDto.create({
        page: 1,
        itemsPerPage: 10,
        sorting: { key: 'id', order: 'DESC' },
      });
      expect(paginationDto).toBeDefined();

      jest.spyOn(InboxEventSequelize, 'findAndCountAll').mockResolvedValue({
        count: 0,
        rows: [],
      } as any);

      // Act
      const result = await datasource.getPaginated(paginationDto!);

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.inboxEvents).toHaveLength(0);
    });

    it('should ignore invalid sorting keys', async () => {
      // Arrange
      const [, paginationDto] = PaginationDto.create({
        page: 1,
        itemsPerPage: 10,
        sorting: { key: 'invalidKey', order: 'ASC' },
      });
      expect(paginationDto).toBeDefined();

      jest.spyOn(InboxEventSequelize, 'findAndCountAll').mockResolvedValue({
        count: 0,
        rows: [],
      } as any);

      // Act
      await datasource.getPaginated(paginationDto!);

      // Assert
      expect(InboxEventSequelize.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [],
        })
      );
    });

    it('should handle page 2 with correct offset', async () => {
      // Arrange
      const [, paginationDto] = PaginationDto.create({
        page: 2,
        itemsPerPage: 10,
      });
      expect(paginationDto).toBeDefined();

      jest.spyOn(InboxEventSequelize, 'findAndCountAll').mockResolvedValue({
        count: 25,
        rows: [],
      } as any);

      // Act
      await datasource.getPaginated(paginationDto!);

      // Assert
      expect(InboxEventSequelize.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10,
        })
      );
    });

    it('should return empty result when no events found', async () => {
      // Arrange
      const [, paginationDto] = PaginationDto.create({
        page: 1,
        itemsPerPage: 10,
      });
      expect(paginationDto).toBeDefined();

      jest.spyOn(InboxEventSequelize, 'findAndCountAll').mockResolvedValue({
        count: 0,
        rows: [],
      } as any);

      // Act
      const result = await datasource.getPaginated(paginationDto!);

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.inboxEvents).toHaveLength(0);
    });

    it('should throw error if query fails', async () => {
      // Arrange
      const [, paginationDto] = PaginationDto.create({
        page: 1,
        itemsPerPage: 10,
      });
      expect(paginationDto).toBeDefined();

      const error = new Error('Database error');
      jest
        .spyOn(InboxEventSequelize, 'findAndCountAll')
        .mockRejectedValue(error);

      // Act & Assert
      await expect(datasource.getPaginated(paginationDto!)).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle search with multiple matching fields', async () => {
      // Arrange
      const [, paginationDto] = PaginationDto.create({
        page: 1,
        itemsPerPage: 10,
        search: 'test',
      });
      expect(paginationDto).toBeDefined();

      const models = [
        {
          id: 1,
          uuid: 'test-uuid',
          type: 'test.type',
          headers: {},
          properties: {},
          payload: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ] as any;

      jest.spyOn(InboxEventSequelize, 'findAndCountAll').mockResolvedValue({
        count: 1,
        rows: models,
      } as any);

      // Act
      const result = await datasource.getPaginated(paginationDto!);

      // Assert
      expect(result.inboxEvents).toHaveLength(1);
    });
  });

  describe('getByUuidWhitProcess', () => {
    it('should return inbox event with associated processes', async () => {
      // Arrange
      const uuid = 'uuid-with-process';
      const now = new Date();

      const inboxModel = {
        id: 5,
        uuid,
        type: 'event.type',
        headers: {},
        properties: {},
        payload: {},
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      const processes = [
        {
          id: 1,
          eventId: 5,
          processName: 'process1',
          duration: 100,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
        {
          id: 2,
          eventId: 5,
          processName: 'process2',
          duration: 200,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ];

      jest
        .spyOn(InboxEventSequelize, 'findOne')
        .mockResolvedValue(inboxModel);
      jest
        .spyOn(EventProcessLogDatasourceImpl.prototype, 'getEventProcessLogByEventId')
        .mockResolvedValue(processes as any);

      // Act
      const result = await datasource.getByUuidWhitProcess(uuid);

      // Assert
      expect(result.inboxEvent.uuid).toBe(uuid);
      expect(result.process).toHaveLength(2);
      expect(result.process[0].processName).toBe('process1');
      expect(InboxEventSequelize.findOne).toHaveBeenCalledWith({
        where: { uuid },
      });
    });

    it('should return inbox event with empty processes', async () => {
      // Arrange
      const uuid = 'uuid-no-processes';
      const now = new Date();

      const inboxModel = {
        id: 10,
        uuid,
        type: 'event.type',
        headers: {},
        properties: {},
        payload: {},
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      jest
        .spyOn(InboxEventSequelize, 'findOne')
        .mockResolvedValue(inboxModel);
      jest
        .spyOn(EventProcessLogDatasourceImpl.prototype, 'getEventProcessLogByEventId')
        .mockResolvedValue([]);

      // Act
      const result = await datasource.getByUuidWhitProcess(uuid);

      // Assert
      expect(result.inboxEvent.uuid).toBe(uuid);
      expect(result.process).toHaveLength(0);
    });

    it('should throw error when inbox event not found', async () => {
      // Arrange
      jest.spyOn(InboxEventSequelize, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        datasource.getByUuidWhitProcess('non-existent')
      ).rejects.toThrow('Inbox event not found');
    });

    it('should correctly map inbox event and processes together', async () => {
      // Arrange
      const uuid = 'uuid-map-test';
      const now = new Date();

      const inboxModel = {
        id: 7,
        uuid,
        type: 'order.created',
        headers: { header1: 'val1' },
        properties: { prop1: 'val1' },
        payload: { data: 'test' },
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      const processes = [
        {
          id: 20,
          eventId: 7,
          processName: 'validate',
          duration: 50,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      ];

      jest
        .spyOn(InboxEventSequelize, 'findOne')
        .mockResolvedValue(inboxModel);
      jest
        .spyOn(EventProcessLogDatasourceImpl.prototype, 'getEventProcessLogByEventId')
        .mockResolvedValue(processes as any);

      // Act
      const result = await datasource.getByUuidWhitProcess(uuid);

      // Assert
      expect(result.inboxEvent.id).toBe(7);
      expect(result.inboxEvent.type).toBe('order.created');
      expect(result.process[0].id).toBe(20);
      expect(result.process[0].processName).toBe('validate');
    });

    it('should call getEventProcessLogByEventId with correct inboxEvent id', async () => {
      // Arrange
      const uuid = 'uuid-id-check';
      const eventId = 15;
      const now = new Date();

      const inboxModel = {
        id: eventId,
        uuid,
        type: 'test',
        headers: {},
        properties: {},
        payload: {},
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;

      jest
        .spyOn(InboxEventSequelize, 'findOne')
        .mockResolvedValue(inboxModel);
      const mockGetProcess = jest
        .spyOn(EventProcessLogDatasourceImpl.prototype, 'getEventProcessLogByEventId')
        .mockResolvedValue([]);

      // Act
      await datasource.getByUuidWhitProcess(uuid);

      // Assert
      expect(mockGetProcess).toHaveBeenCalledWith(eventId);
    });
  });
});
