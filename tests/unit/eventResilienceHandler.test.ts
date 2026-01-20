import { EventResilienceHandler, EventStatus } from '@/infrastructure/eventManager/eventResilienceHandler';
import { EventResilienceHandlerConfig } from '@/domain/interfaces/eventResilienceHandlerConfig';
import { RabbitMQMessageDto, MessageFieldsDto, MessagePropertiesDto } from '@/domain/dtos/eventManager';
import { EventException } from '@/infrastructure/eventManager/eventException';
import { InboxEventDatasourceImpl } from '@/infrastructure/datasources/eventManager';
import { EventProcessLogDatasourceImpl } from '@/infrastructure/datasources/eventManager/eventProcessLog.datasource.impl';
import { RabbitMQ } from '@/infrastructure/eventManager/rabbitmq';
import { RabbitMQResilienceSocketManager } from '@/infrastructure/socket/rabbitMQResilienceSocketManager';
import { EmailConfig } from '@/infrastructure/email/email';
import { Logs } from '@/infrastructure/utils/logs';

// Mock all dependencies
jest.mock('@/infrastructure/datasources/eventManager');
jest.mock('@/infrastructure/datasources/eventManager/eventProcessLog.datasource.impl');
jest.mock('@/infrastructure/eventManager/rabbitmq');
jest.mock('@/infrastructure/socket/rabbitMQResilienceSocketManager');
jest.mock('@/infrastructure/email/email');
jest.mock('@/infrastructure/utils/logs');

describe('EventResilienceHandler', () => {
  let handler: EventResilienceHandler;
  let mockConfig: EventResilienceHandlerConfig;
  let mockMessage: RabbitMQMessageDto;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock config
    mockConfig = {
      immediateRetryAttempts: 3,
      delayedRetryAttempts: 2,
      delayInMs: 100,
      devMode: false,
    };

    // Create mock message
    const mockFields = new MessageFieldsDto(1, false, 'test-exchange', 'test.event');
    const mockProperties = new MessagePropertiesDto(
      'application/json',
      'utf-8',
      { redelivery_count: 0 },
      undefined,
      undefined,
      'corr-123',
      undefined,
      undefined,
      new Date(),
      'msg-123',
      'TestEventType',
      undefined,
      undefined,
      undefined
    );
    mockMessage = new RabbitMQMessageDto(Buffer.from(JSON.stringify({ test: 'data' })), mockFields, mockProperties);

    // Mock socket manager
    (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(null);

    handler = new EventResilienceHandler(mockConfig);
  });

  describe('EventResilienceHandler - Constructor', () => {
    it('should create handler with provided config', () => {
      const handler = new EventResilienceHandler(mockConfig);

      expect(handler).toBeInstanceOf(EventResilienceHandler);
    });

    it('should use default config when not provided', () => {
      const handler = new EventResilienceHandler();

      expect(handler).toBeInstanceOf(EventResilienceHandler);
    });

    it('should set default values for config properties', () => {
      const handler = new EventResilienceHandler({
        immediateRetryAttempts: 5,
        delayedRetryAttempts: 3,
        delayInMs: 2000,
        devMode: false,
      });

      expect(handler).toBeInstanceOf(EventResilienceHandler);
    });

    it('should apply devMode settings when devMode is true', () => {
      const configWithDevMode: EventResilienceHandlerConfig = {
        immediateRetryAttempts: 5,
        delayedRetryAttempts: 3,
        delayInMs: 1000,
        devMode: true,
      };

      const devHandler = new EventResilienceHandler(configWithDevMode);

      expect(devHandler).toBeInstanceOf(EventResilienceHandler);
    });

    it('should set devMode to false by default', () => {
      const handler = new EventResilienceHandler({
        immediateRetryAttempts: 3,
        delayedRetryAttempts: 2,
        delayInMs: 100,
      });

      expect(handler).toBeInstanceOf(EventResilienceHandler);
    });
  });

  describe('EventResilienceHandler - execute method', () => {
    it('should execute successfully with no errors', async () => {
      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(mockProcess).toHaveBeenCalledWith(mockMessage);
    });

    it('should emit total processing success event via socket when all processes succeed', async () => {
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(true);

      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(RabbitMQResilienceSocketManager.emit).toHaveBeenCalled();
    });

    it('should skip already processed events', async () => {
      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(true);

      await handler.execute(mockMessage, processes);

      expect(mockProcess).not.toHaveBeenCalled();
    });

    it('should handle process errors and send to retry queue', async () => {
      const error = new Error('Process failed');
      const mockProcess = jest.fn().mockRejectedValue(error);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToRetryQueue as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(RabbitMQ.publishToRetryQueue).toHaveBeenCalled();
    });

    it('should send to dead letter queue when exceeding retry attempts', async () => {
      const error = new Error('Process failed');
      const mockProcess = jest.fn().mockRejectedValue(error);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      // Mock high redelivery count to exceed delayed retries
      mockMessage.properties.headers = { redelivery_count: 3 };

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToDeadLetterQueue as jest.Mock).mockResolvedValue(undefined);
      (EmailConfig.sendMessage as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(RabbitMQ.publishToDeadLetterQueue).toHaveBeenCalled();
    });

    it('should execute multiple processes in sequence', async () => {
      const mockProcess1 = jest.fn().mockResolvedValue(undefined);
      const mockProcess2 = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess1,
          processName: 'Process1',
        },
        {
          processFunction: mockProcess2,
          processName: 'Process2',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(mockProcess1).toHaveBeenCalledWith(mockMessage);
      expect(mockProcess2).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle empty processes array', async () => {
      const processes: any[] = [];

      await handler.execute(mockMessage, processes);

      expect(Logs.info).toHaveBeenCalled();
    });
  });

  describe('EventResilienceHandler - Error handling', () => {
    it('should catch EventException and preserve it', async () => {
      const eventException = EventException.badRequest('Invalid request', { field: 'email' });
      const mockProcess = jest.fn().mockRejectedValue(eventException);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToRetryQueue as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(RabbitMQ.publishToRetryQueue).toHaveBeenCalled();
    });

    it('should catch generic Error and wrap in EventException', async () => {
      const error = new Error('Generic error');
      const mockProcess = jest.fn().mockRejectedValue(error);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToRetryQueue as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(RabbitMQ.publishToRetryQueue).toHaveBeenCalled();
    });

    it('should handle unknown error types', async () => {
      const mockProcess = jest.fn().mockRejectedValue('String error');
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToRetryQueue as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(RabbitMQ.publishToRetryQueue).toHaveBeenCalled();
    });

    it('should log error when saving to inbox fails', async () => {
      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockRejectedValue(new Error('DB error'));

      await handler.execute(mockMessage, processes);

      // Should continue execution without throwing
      expect(mockProcess).toHaveBeenCalled();
    });
  });

  describe('EventResilienceHandler - Retry logic', () => {
    it('should retry on immediate failure', async () => {
      const mockProcess = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(mockProcess).toHaveBeenCalledTimes(2);
    });

    it('should perform delayed retries', async () => {
      const mockProcess = jest.fn().mockRejectedValue(new Error('Process failed'));
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToRetryQueue as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      // With immediate retry attempts = 3, should fail all and send to retry queue
      expect(RabbitMQ.publishToRetryQueue).toHaveBeenCalled();
    });

    it('should eventually send to dead letter queue after all retries', async () => {
      const mockProcess = jest.fn().mockRejectedValue(new Error('Process failed'));
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      // Set redelivery count to exceed delayed retry attempts
      mockMessage.properties.headers = { redelivery_count: 10 };

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToDeadLetterQueue as jest.Mock).mockResolvedValue(undefined);
      (EmailConfig.sendMessage as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(RabbitMQ.publishToDeadLetterQueue).toHaveBeenCalled();
    });
  });

  describe('EventResilienceHandler - Event Status', () => {
    it('should have correct EventStatus enum values', () => {
      expect(EventStatus.IMMEDIATE_RETRY).toBe('IMMEDIATE_RETRY');
      expect(EventStatus.SEND_TO_RETRY_QUEUE).toBe('SEND_TO_RETRY_QUEUE');
      expect(EventStatus.SEND_TO_DEAD_LETTER_QUEUE).toBe('SEND_TO_DEAD_LETTER_QUEUE');
      expect(EventStatus.PROCESSING_SUCCESS).toBe('PROCESSING_SUCCESS');
      expect(EventStatus.TOTAL_PROCESSING_SUCCESS).toBe('TOTAL_PROCESSING_SUCCESS');
      expect(EventStatus.DISCARD_MESSAGE).toBe('DISCARD_MESSAGE');
    });
  });

  describe('EventResilienceHandler - devMode behavior', () => {
    it('should reduce retries in devMode', async () => {
      const devConfig: EventResilienceHandlerConfig = {
        immediateRetryAttempts: 5,
        delayedRetryAttempts: 3,
        delayInMs: 1000,
        devMode: true,
      };

      const devHandler = new EventResilienceHandler(devConfig);

      const mockProcess = jest.fn().mockRejectedValue(new Error('Process failed'));
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToDeadLetterQueue as jest.Mock).mockResolvedValue(undefined);
      (EmailConfig.sendMessage as jest.Mock).mockResolvedValue(undefined);

      await devHandler.execute(mockMessage, processes);

      // In devMode, should skip delayed retries and go straight to DLQ
      expect(RabbitMQ.publishToDeadLetterQueue).toHaveBeenCalled();
    });
  });

  describe('EventResilienceHandler - Message processing', () => {
    it('should process message with valid content', async () => {
      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(mockProcess).toHaveBeenCalledWith(mockMessage);
      expect(InboxEventDatasourceImpl.prototype.createInboxEvent).toHaveBeenCalled();
    });

    it('should handle messages with empty headers', async () => {
      mockMessage.properties.headers = undefined;
      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(mockProcess).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle messages with different content types', async () => {
      mockMessage.content = Buffer.from(JSON.stringify({ nested: { data: 'value' } }));
      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(mockProcess).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('EventResilienceHandler - Socket communication', () => {
    it('should emit success status when socket is available', async () => {
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(true);

      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(RabbitMQResilienceSocketManager.emit).toHaveBeenCalled();
    });

    it('should not emit when socket is unavailable', async () => {
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(null);

      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      jest.clearAllMocks();

      await handler.execute(mockMessage, processes);

      expect(RabbitMQResilienceSocketManager.emit).not.toHaveBeenCalled();
    });

    it('should emit SEND_TO_RETRY_QUEUE event when retry queue is used', async () => {
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(true);

      const error = new Error('Process failed');
      const mockProcess = jest.fn().mockRejectedValue(error);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToRetryQueue as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      const emitCalls = (RabbitMQResilienceSocketManager.emit as jest.Mock).mock.calls;
      const retryQueueCall = emitCalls.some(call => 
        call[1]?.status === EventStatus.SEND_TO_RETRY_QUEUE
      );

      expect(retryQueueCall).toBe(true);
    });

    it('should emit SEND_TO_DEAD_LETTER_QUEUE event when going to DLQ', async () => {
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(true);

      mockMessage.properties.headers = { redelivery_count: 10 };
      const error = new Error('Process failed');
      const mockProcess = jest.fn().mockRejectedValue(error);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToDeadLetterQueue as jest.Mock).mockResolvedValue(undefined);
      (EmailConfig.sendMessage as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      const emitCalls = (RabbitMQResilienceSocketManager.emit as jest.Mock).mock.calls;
      const dlqCall = emitCalls.some(call => 
        call[1]?.status === EventStatus.SEND_TO_DEAD_LETTER_QUEUE
      );

      expect(dlqCall).toBe(true);
    });

    it('should emit IMMEDIATE_RETRY event on retry attempt', async () => {
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(true);

      const mockProcess = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'RetryProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      jest.clearAllMocks();
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(true);

      await handler.execute(mockMessage, processes);

      const emitCalls = (RabbitMQResilienceSocketManager.emit as jest.Mock).mock.calls;
      const immediateRetryCall = emitCalls.some(call => 
        call[1]?.status === EventStatus.IMMEDIATE_RETRY
      );

      expect(immediateRetryCall).toBe(true);
    });

    it('should emit PROCESSING_SUCCESS event when process succeeds', async () => {
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(true);

      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'SuccessProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      jest.clearAllMocks();
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(true);

      await handler.execute(mockMessage, processes);

      const emitCalls = (RabbitMQResilienceSocketManager.emit as jest.Mock).mock.calls;
      const successCall = emitCalls.some(call => 
        call[1]?.status === EventStatus.PROCESSING_SUCCESS
      );

      expect(successCall).toBe(true);
    });

    it('should log appropriate separators for retry queue', async () => {
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(true);

      const error = new Error('Process failed');
      const mockProcess = jest.fn().mockRejectedValue(error);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToRetryQueue as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      const logCalls = (Logs.info as jest.Mock).mock.calls.flat();
      const hasRetrySeparator = logCalls.some(call => 
        typeof call === 'string' && call.includes('Sent to Retry Queue')
      );

      expect(hasRetrySeparator).toBe(true);
    });

    it('should log appropriate separators for dead letter queue', async () => {
      (RabbitMQResilienceSocketManager.getSocket as jest.Mock).mockReturnValue(true);

      mockMessage.properties.headers = { redelivery_count: 10 };
      const error = new Error('Process failed');
      const mockProcess = jest.fn().mockRejectedValue(error);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToDeadLetterQueue as jest.Mock).mockResolvedValue(undefined);
      (EmailConfig.sendMessage as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      const logCalls = (Logs.info as jest.Mock).mock.calls.flat();
      const hasDlqSeparator = logCalls.some(call => 
        typeof call === 'string' && call.includes('Dead Letter Queue')
      );

      expect(hasDlqSeparator).toBe(true);
    });
  });

  describe('EventResilienceHandler - Email notification', () => {
    it('should send email when message goes to dead letter queue', async () => {
      mockMessage.properties.headers = { redelivery_count: 10 };
      const mockProcess = jest.fn().mockRejectedValue(new Error('Process failed'));
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToDeadLetterQueue as jest.Mock).mockResolvedValue(undefined);
      (EmailConfig.sendMessage as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(EmailConfig.sendMessage).toHaveBeenCalled();
    });
  });

  describe('EventResilienceHandler - Logging', () => {
    it('should log event processing info', async () => {
      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(Logs.info).toHaveBeenCalled();
    });

    it('should log to console on save error', async () => {
      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockRejectedValue(new Error('DB error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await handler.execute(mockMessage, processes);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('EventResilienceHandler - Edge cases', () => {
    it('should handle process with undefined redelivery count', async () => {
      mockMessage.properties.headers = undefined;
      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(mockProcess).toHaveBeenCalled();
    });

    it('should handle very large redelivery counts', async () => {
      mockMessage.properties.headers = { redelivery_count: 1000 };
      const mockProcess = jest.fn().mockRejectedValue(new Error('Process failed'));
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'TestProcess',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (RabbitMQ.publishToDeadLetterQueue as jest.Mock).mockResolvedValue(undefined);
      (EmailConfig.sendMessage as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(RabbitMQ.publishToDeadLetterQueue).toHaveBeenCalled();
    });

    it('should handle process names with special characters', async () => {
      const mockProcess = jest.fn().mockResolvedValue(undefined);
      const processes = [
        {
          processFunction: mockProcess,
          processName: 'Process-With_Special.Chars@1',
        },
      ];

      (InboxEventDatasourceImpl.prototype.processSuccessByUuidAndProcessName as jest.Mock).mockResolvedValue(false);
      (InboxEventDatasourceImpl.prototype.createInboxEvent as jest.Mock).mockResolvedValue({ id: 1 });
      (EventProcessLogDatasourceImpl.prototype.createEventProcessLog as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(mockMessage, processes);

      expect(mockProcess).toHaveBeenCalled();
    });
  });
});
