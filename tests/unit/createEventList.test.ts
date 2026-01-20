import { createEventList } from '@/infrastructure/eventManager/createEventList';
import { EventResilienceHandler } from '@/infrastructure/eventManager/eventResilienceHandler';
import { RabbitMQResilienceConfig } from '@/domain/interfaces/rabbitMQResilienceConfig';
import { EventProcessConfig } from '@/domain/interfaces/eventProcessConfig';
import { RabbitMQMessageDto, MessageFieldsDto, MessagePropertiesDto } from '@/domain/dtos/eventManager';
import { EventResilienceHandlerConfig } from '@/domain/interfaces/eventResilienceHandlerConfig';
import { EmailConfigInterface } from '@/domain/interfaces/emailConfig';

// Mock EventResilienceHandler
jest.mock('@/infrastructure/eventManager/eventResilienceHandler');

describe('createEventList', () => {
  let mockEventResilienceHandler: jest.Mocked<EventResilienceHandler>;
  let mockConfig: RabbitMQResilienceConfig;
  let mockEventResilienceHandlerConfig: EventResilienceHandlerConfig;
  let mockEmailConfig: EmailConfigInterface;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock EventResilienceHandler
    mockEventResilienceHandler = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    (EventResilienceHandler as jest.MockedClass<typeof EventResilienceHandler>).mockImplementation(
      () => mockEventResilienceHandler
    );

    // Setup basic config
    mockEmailConfig = {
      APP_NAME: 'Test App',
      EMAIL: 'noreply@example.com',
      EMAIL_AUTH_USER: 'test@example.com',
      EMAIL_AUTH_PASS: 'password',
      EMAIL_HOST: 'smtp.example.com',
      EMAIL_PORT: 587,
    };

    mockEventResilienceHandlerConfig = {
      immediateRetryAttempts: 3,
      delayedRetryAttempts: 5,
      delayInMs: 1000,
      devMode: false,
    };

    mockConfig = {
      rabbitMQConfigConnect: {
        hostname: 'localhost',
        port: 5672,
        username: 'guest',
        password: 'guest',
      },
      queue: 'test-queue',
      routingKey: 'test.#',
      exchange: 'test-exchange',
      typeExchange: 'topic',
      prefetch: 1,
      directExchange: 'amq.direct',
      typeDirectExchange: 'direct',
      retryQueue: 'retry-queue',
      retryRoutingKey: 'retry.#',
      retryEndpoint: 'http://localhost:3000/retry',
      deadLetterQueue: 'dead-letter-queue',
      deadLetterRoutingKey: 'dead-letter.#',
      messageTTL: 3600000,
      eventResilienceHandlerConfig: mockEventResilienceHandlerConfig,
      eventsToProcess: [
        {
          eventType: 'user.created',
          processes: [
            {
              processFunction: async (event: RabbitMQMessageDto) => {
                console.log('Processing user.created', event);
              },
              processName: 'CreateUserProcess',
            },
          ],
        },
        {
          eventType: 'user.updated',
          processes: [
            {
              processFunction: async (event: RabbitMQMessageDto) => {
                console.log('Processing user.updated', event);
              },
              processName: 'UpdateUserProcess',
            },
          ],
        },
      ],
      sequelizeConnection: null,
      emailConfig: mockEmailConfig,
    };
  });

  describe('createEventList - Basic Functionality', () => {
    it('should create a Map with correct structure', () => {
      const eventList = createEventList(mockConfig);

      expect(eventList).toBeInstanceOf(Map);
      expect(eventList.size).toBe(2);
    });

    it('should register all events from config', () => {
      const eventList = createEventList(mockConfig);

      expect(eventList.has('user.created')).toBe(true);
      expect(eventList.has('user.updated')).toBe(true);
    });

    it('should create handler functions for each event', () => {
      const eventList = createEventList(mockConfig);

      const userCreatedHandler = eventList.get('user.created');
      const userUpdatedHandler = eventList.get('user.updated');

      expect(userCreatedHandler).toBeDefined();
      expect(typeof userCreatedHandler).toBe('function');
      expect(userUpdatedHandler).toBeDefined();
      expect(typeof userUpdatedHandler).toBe('function');
    });

    it('should instantiate EventResilienceHandler with provided config', () => {
      createEventList(mockConfig);

      expect(EventResilienceHandler).toHaveBeenCalledWith(mockEventResilienceHandlerConfig);
    });

    it('should instantiate EventResilienceHandler only once', () => {
      createEventList(mockConfig);

      expect(EventResilienceHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('createEventList - Handler Execution', () => {
    it('should call EventResilienceHandler.execute when handler is invoked', async () => {
      const eventList = createEventList(mockConfig);
      const handler = eventList.get('user.created')!;

      const mockFields = new MessageFieldsDto(1, false, 'test-exchange', 'user.created');
      const mockProperties = new MessagePropertiesDto('application/json', 'utf-8', undefined, undefined, undefined, 'corr-123', undefined, undefined, new Date(), 'msg-123', undefined, undefined, undefined, undefined);
      const mockMessage = new RabbitMQMessageDto(Buffer.from(JSON.stringify({ userId: 123, name: 'John' })), mockFields, mockProperties);

      await handler(mockMessage);

      expect(mockEventResilienceHandler.execute).toHaveBeenCalledWith(
        mockMessage,
        mockConfig.eventsToProcess[0].processes
      );
    });

    it('should pass correct processes to handler', async () => {
      const eventList = createEventList(mockConfig);
      const handler = eventList.get('user.updated')!;

      const mockFields = new MessageFieldsDto(2, false, 'test-exchange', 'user.updated');
      const mockProperties = new MessagePropertiesDto('application/json', 'utf-8', undefined, undefined, undefined, 'corr-456', undefined, undefined, new Date(), 'msg-456', undefined, undefined, undefined, undefined);
      const mockMessage = new RabbitMQMessageDto(Buffer.from(JSON.stringify({ userId: 123, updatedField: 'value' })), mockFields, mockProperties);

      await handler(mockMessage);

      expect(mockEventResilienceHandler.execute).toHaveBeenCalledWith(
        mockMessage,
        mockConfig.eventsToProcess[1].processes
      );
    });

    it('should handle handler execution errors', async () => {
      const testError = new Error('Handler execution failed');
      mockEventResilienceHandler.execute.mockRejectedValue(testError);

      const eventList = createEventList(mockConfig);
      const handler = eventList.get('user.created')!;

      const mockFields = new MessageFieldsDto(3, false, 'test-exchange', 'user.created');
      const mockProperties = new MessagePropertiesDto('application/json', 'utf-8', undefined, undefined, undefined, 'corr-789', undefined, undefined, new Date(), 'msg-789', undefined, undefined, undefined, undefined);
      const mockMessage = new RabbitMQMessageDto(Buffer.from(JSON.stringify({ userId: 456 })), mockFields, mockProperties);

      await expect(handler(mockMessage)).rejects.toThrow('Handler execution failed');
    });
  });;

  describe('createEventList - Edge Cases', () => {
    it('should handle empty eventsToProcess array', () => {
      mockConfig.eventsToProcess = [];

      const eventList = createEventList(mockConfig);

      expect(eventList).toBeInstanceOf(Map);
      expect(eventList.size).toBe(0);
    });

    it('should handle single event in eventsToProcess', () => {
      mockConfig.eventsToProcess = [
        {
          eventType: 'single.event',
          processes: [
            {
              processFunction: async (event: RabbitMQMessageDto) => {
                console.log('Single event');
              },
              processName: 'SingleEventProcess',
            },
          ],
        },
      ];

      const eventList = createEventList(mockConfig);

      expect(eventList.size).toBe(1);
      expect(eventList.has('single.event')).toBe(true);
    });

    it('should handle multiple processes for single event type', async () => {
      const process1 = jest.fn();
      const process2 = jest.fn();
      const process3 = jest.fn();

      mockConfig.eventsToProcess = [
        {
          eventType: 'multi.process',
          processes: [
            { processFunction: process1, processName: 'Process1' },
            { processFunction: process2, processName: 'Process2' },
            { processFunction: process3, processName: 'Process3' },
          ],
        },
      ];

      const eventList = createEventList(mockConfig);
      const handler = eventList.get('multi.process')!;

      const mockFields = new MessageFieldsDto(4, false, 'test-exchange', 'multi.process');
      const mockProperties = new MessagePropertiesDto('application/json', 'utf-8', undefined, undefined, undefined, 'corr-multi', undefined, undefined, new Date(), 'msg-multi', undefined, undefined, undefined, undefined);
      const mockMessage = new RabbitMQMessageDto(Buffer.from(JSON.stringify({ test: 'data' })), mockFields, mockProperties);

      await handler(mockMessage);

      expect(mockEventResilienceHandler.execute).toHaveBeenCalledWith(
        mockMessage,
        [
          { processFunction: process1, processName: 'Process1' },
          { processFunction: process2, processName: 'Process2' },
          { processFunction: process3, processName: 'Process3' },
        ]
      );
    });

    it('should handle event types with special characters', () => {
      mockConfig.eventsToProcess = [
        {
          eventType: 'user.created.v1.beta-2',
          processes: [
            {
              processFunction: async (event: RabbitMQMessageDto) => {
                console.log('Special chars event');
              },
              processName: 'SpecialCharsProcess',
            },
          ],
        },
      ];

      const eventList = createEventList(mockConfig);

      expect(eventList.has('user.created.v1.beta-2')).toBe(true);
    });

    it('should handle long event type names', () => {
      const longEventType =
        'very.long.event.type.name.that.represents.a.complex.business.process.with.multiple.stages';

      mockConfig.eventsToProcess = [
        {
          eventType: longEventType,
          processes: [
            {
              processFunction: async (event: RabbitMQMessageDto) => {
                console.log('Long event name');
              },
              processName: 'LongNameProcess',
            },
          ],
        },
      ];

      const eventList = createEventList(mockConfig);

      expect(eventList.has(longEventType)).toBe(true);
    });

    it('should maintain separate handler instances for each event type', async () => {
      const eventList = createEventList(mockConfig);

      const handler1 = eventList.get('user.created')!;
      const handler2 = eventList.get('user.updated')!;

      expect(handler1).not.toBe(handler2);
    });
  });

  describe('createEventList - Multiple Calls', () => {
    it('should create independent Map instances on multiple calls', () => {
      const eventList1 = createEventList(mockConfig);
      const eventList2 = createEventList(mockConfig);

      expect(eventList1).not.toBe(eventList2);
      expect(eventList1.get('user.created')).not.toBe(eventList2.get('user.created'));
    });

    it('should create new EventResilienceHandler instances for each call', () => {
      createEventList(mockConfig);
      createEventList(mockConfig);

      expect(EventResilienceHandler).toHaveBeenCalledTimes(2);
    });

    it('should properly isolate handlers between multiple calls', async () => {
      mockEventResilienceHandler.execute.mockResolvedValue(undefined);

      const eventList1 = createEventList(mockConfig);
      const handler1 = eventList1.get('user.created')!;

      jest.clearAllMocks();

      mockEventResilienceHandler.execute.mockResolvedValue(undefined);

      const eventList2 = createEventList(mockConfig);
      const handler2 = eventList2.get('user.created')!;

      const mockFields = new MessageFieldsDto(5, false, 'test-exchange', 'user.created');
      const mockProperties = new MessagePropertiesDto('application/json', 'utf-8', undefined, undefined, undefined, 'corr-isolation', undefined, undefined, new Date(), 'msg-isolation', undefined, undefined, undefined, undefined);
      const mockMessage = new RabbitMQMessageDto(Buffer.from(JSON.stringify({ userId: 789 })), mockFields, mockProperties);

      await handler2(mockMessage);

      expect(EventResilienceHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('createEventList - Return Type Validation', () => {
    it('should return a Map type', () => {
      const eventList = createEventList(mockConfig);

      expect(eventList).toBeInstanceOf(Map);
      expect(typeof eventList.get).toBe('function');
      expect(typeof eventList.set).toBe('function');
      expect(typeof eventList.has).toBe('function');
    });

    it('should have all event types as keys', () => {
      const eventList = createEventList(mockConfig);
      const keys = Array.from(eventList.keys());

      expect(keys).toEqual(['user.created', 'user.updated']);
    });

    it('should have handler functions as values', () => {
      const eventList = createEventList(mockConfig);
      const values = Array.from(eventList.values());

      values.forEach((value) => {
        expect(typeof value).toBe('function');
      });
    });

    it('should return Map with correct generic types', () => {
      const eventList = createEventList(mockConfig);

      // Type checking - should accept string keys
      const handler = eventList.get('user.created');
      expect(handler).toBeDefined();

      // Type checking - handler should accept RabbitMQMessageDto and return Promise<void>
      expect(typeof handler).toBe('function');
    });
  });
});
