/**
 * Tests unitarios completos para RabbitMQMessageDto, MessageFieldsDto y MessagePropertiesDto
 * Coverage: create, validate
 */

import {
  RabbitMQMessageDto,
  MessageFieldsDto,
  MessagePropertiesDto,
} from '@/domain/dtos/eventManager/rabbitMQMessage.dto';

describe('RabbitMQMessageDto', () => {
  describe('create', () => {
    it('should create a valid RabbitMQMessageDto', () => {
      // Arrange
      const content = Buffer.from('test content');
      const fields = {
        delivery_tag: 1,
        redelivered: false,
        exchange: 'test.exchange',
        routing_key: 'test.routing.key',
      };
      const properties = {
        contentType: 'application/json',
        type: 'test.event',
        messageId: 'msg-123',
      };

      const data = { content, fields, properties };

      // Act
      const [errors, dto] = RabbitMQMessageDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.content).toBe(content);
      expect(dto!.fields.deliveryTag).toBe(1);
      expect(dto!.properties.type).toBe('test.event');
    });

    it('should fail with invalid content (not Buffer)', () => {
      // Arrange
      const data = {
        content: 'string content',
        fields: {
          delivery_tag: 1,
          redelivered: false,
          exchange: 'test.exchange',
          routing_key: 'test.routing.key',
        },
        properties: {
          type: 'test.event',
          messageId: 'msg-123',
        },
      };

      // Act
      const [errors, dto] = RabbitMQMessageDto.create(data);

      // Assert
      expect(errors).toContain('Invalid content');
      expect(dto).toBeUndefined();
    });

    it('should fail with content = null', () => {
      // Arrange
      const data = {
        content: null,
        fields: {
          delivery_tag: 1,
          redelivered: false,
          exchange: 'test.exchange',
          routing_key: 'test.routing.key',
        },
        properties: {
          type: 'test.event',
          messageId: 'msg-123',
        },
      };

      // Act
      const [errors, dto] = RabbitMQMessageDto.create(data);

      // Assert
      expect(errors).toContain('Invalid content');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid fields (null)', () => {
      // Arrange
      const data = {
        content: Buffer.from('test'),
        fields: null,
        properties: {
          type: 'test.event',
          messageId: 'msg-123',
        },
      };

      // Act & Assert
      expect(() => RabbitMQMessageDto.create(data)).toThrow();
    });

    it('should fail with invalid fields (not object)', () => {
      // Arrange
      const data = {
        content: Buffer.from('test'),
        fields: 'invalid',
        properties: {
          type: 'test.event',
          messageId: 'msg-123',
        },
      };

      // Act
      const [errors, dto] = RabbitMQMessageDto.create(data);

      // Assert
      expect(errors).toContain('Invalid fields');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid properties (null)', () => {
      // Arrange
      const data = {
        content: Buffer.from('test'),
        fields: {
          delivery_tag: 1,
          redelivered: false,
          exchange: 'test.exchange',
          routing_key: 'test.routing.key',
        },
        properties: null,
      };

      // Act & Assert
      expect(() => RabbitMQMessageDto.create(data)).toThrow();
    });

    it('should fail with invalid properties (not object)', () => {
      // Arrange
      const data = {
        content: Buffer.from('test'),
        fields: {
          delivery_tag: 1,
          redelivered: false,
          exchange: 'test.exchange',
          routing_key: 'test.routing.key',
        },
        properties: 'invalid',
      };

      // Act
      const [errors, dto] = RabbitMQMessageDto.create(data);

      // Assert
      expect(errors).toContain('Invalid properties');
      expect(dto).toBeUndefined();
    });

    it('should collect all validation errors from nested dtos', () => {
      // Arrange
      const data = {
        content: Buffer.from('test'),
        fields: {
          delivery_tag: 'invalid',
          redelivered: false,
          exchange: 'test.exchange',
          routing_key: 'test.routing.key',
        },
        properties: {
          type: 123,
          messageId: 456,
        },
      };

      // Act
      const [errors, dto] = RabbitMQMessageDto.create(data);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(dto).toBeUndefined();
    });

    it('should handle Buffer with empty content', () => {
      // Arrange
      const content = Buffer.from('');
      const data = {
        content,
        fields: {
          delivery_tag: 1,
          redelivered: false,
          exchange: 'test.exchange',
          routing_key: 'test.routing.key',
        },
        properties: {
          type: 'test.event',
          messageId: 'msg-123',
        },
      };

      // Act
      const [errors, dto] = RabbitMQMessageDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.content.length).toBe(0);
    });

    it('should handle large Buffer content', () => {
      // Arrange
      const largeContent = Buffer.alloc(1000000);
      const data = {
        content: largeContent,
        fields: {
          delivery_tag: 1,
          redelivered: false,
          exchange: 'test.exchange',
          routing_key: 'test.routing.key',
        },
        properties: {
          type: 'test.event',
          messageId: 'msg-123',
        },
      };

      // Act
      const [errors, dto] = RabbitMQMessageDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.content.length).toBe(1000000);
    });
  });
});

describe('MessageFieldsDto', () => {
  describe('create', () => {
    it('should create a valid MessageFieldsDto', () => {
      // Arrange
      const data = {
        delivery_tag: 1,
        redelivered: false,
        exchange: 'test.exchange',
        routing_key: 'test.routing.key',
      };

      // Act
      const [errors, dto] = MessageFieldsDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.deliveryTag).toBe(1);
      expect(dto!.redelivered).toBe(false);
      expect(dto!.exchange).toBe('test.exchange');
      expect(dto!.routingKey).toBe('test.routing.key');
    });

    it('should create MessageFieldsDto with optional fields', () => {
      // Arrange
      const data = {
        delivery_tag: 5,
        redelivered: true,
        exchange: 'exchange.name',
        routing_key: 'routing.key',
        message_count: 10,
        consumer_tag: 'consumer-123',
      };

      // Act
      const [errors, dto] = MessageFieldsDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.messageCount).toBe(10);
      expect(dto!.consumerTag).toBe('consumer-123');
    });

    it('should fail with invalid deliveryTag (not number)', () => {
      // Arrange
      const data = {
        delivery_tag: 'invalid',
        redelivered: false,
        exchange: 'test.exchange',
        routing_key: 'test.routing.key',
      };

      // Act
      const [errors, dto] = MessageFieldsDto.create(data);

      // Assert
      expect(errors).toContain('Invalid deliveryTag');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid redelivered (not boolean)', () => {
      // Arrange
      const data = {
        delivery_tag: 1,
        redelivered: 'true',
        exchange: 'test.exchange',
        routing_key: 'test.routing.key',
      };

      // Act
      const [errors, dto] = MessageFieldsDto.create(data);

      // Assert
      expect(errors).toContain('Invalid redelivered');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid exchange (not string)', () => {
      // Arrange
      const data = {
        delivery_tag: 1,
        redelivered: false,
        exchange: 123,
        routing_key: 'test.routing.key',
      };

      // Act
      const [errors, dto] = MessageFieldsDto.create(data);

      // Assert
      expect(errors).toContain('Invalid exchange');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid routingKey (not string)', () => {
      // Arrange
      const data = {
        delivery_tag: 1,
        redelivered: false,
        exchange: 'test.exchange',
        routing_key: 123,
      };

      // Act
      const [errors, dto] = MessageFieldsDto.create(data);

      // Assert
      expect(errors).toContain('Invalid routingKey');
      expect(dto).toBeUndefined();
    });

    it('should fail with multiple validation errors', () => {
      // Arrange
      const data = {
        delivery_tag: 'invalid',
        redelivered: 'invalid',
        exchange: 123,
        routing_key: 456,
      };

      // Act
      const [errors, dto] = MessageFieldsDto.create(data);

      // Assert
      expect(errors.length).toBeGreaterThan(1);
      expect(dto).toBeUndefined();
    });

    it('should accept deliveryTag = 0', () => {
      // Arrange
      const data = {
        delivery_tag: 0,
        redelivered: false,
        exchange: 'test.exchange',
        routing_key: 'test.routing.key',
      };

      // Act
      const [errors, dto] = MessageFieldsDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.deliveryTag).toBe(0);
    });

    it('should accept empty strings for exchange and routingKey', () => {
      // Arrange
      const data = {
        delivery_tag: 1,
        redelivered: false,
        exchange: '',
        routing_key: '',
      };

      // Act
      const [errors, dto] = MessageFieldsDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.exchange).toBe('');
      expect(dto!.routingKey).toBe('');
    });

    it('should accept undefined optional fields', () => {
      // Arrange
      const data = {
        delivery_tag: 1,
        redelivered: false,
        exchange: 'test.exchange',
        routing_key: 'test.routing.key',
        message_count: undefined,
        consumer_tag: undefined,
      };

      // Act
      const [errors, dto] = MessageFieldsDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.messageCount).toBeUndefined();
      expect(dto!.consumerTag).toBeUndefined();
    });
  });
});

describe('MessagePropertiesDto', () => {
  describe('create', () => {
    it('should create a valid MessagePropertiesDto', () => {
      // Arrange
      const data = {
        contentType: 'application/json',
        type: 'test.event',
        messageId: 'msg-123',
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.contentType).toBe('application/json');
      expect(dto!.type).toBe('test.event');
      expect(dto!.messageId).toBe('msg-123');
    });

    it('should create MessagePropertiesDto with all properties', () => {
      // Arrange
      const data = {
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        headers: { 'x-custom': 'value' },
        deliveryMode: 2,
        priority: 5,
        correlationId: 'corr-123',
        replyTo: 'reply.queue',
        expiration: '60000',
        timestamp: Date.now(),
        messageId: 'msg-123',
        type: 'test.event',
        userId: 'user-123',
        appId: 'app-123',
        clusterId: 'cluster-123',
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.contentType).toBe('application/json');
      expect(dto!.headers).toEqual({ 'x-custom': 'value' });
      expect(dto!.clusterId).toBe('cluster-123');
    });

    it('should fail with missing type', () => {
      // Arrange
      const data = {
        contentType: 'application/json',
        messageId: 'msg-123',
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing type');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid type (not string)', () => {
      // Arrange
      const data = {
        contentType: 'application/json',
        type: 123,
        messageId: 'msg-123',
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing type');
      expect(dto).toBeUndefined();
    });

    it('should fail with missing messageId', () => {
      // Arrange
      const data = {
        contentType: 'application/json',
        type: 'test.event',
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing messageId');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid messageId (not string)', () => {
      // Arrange
      const data = {
        contentType: 'application/json',
        type: 'test.event',
        messageId: 123,
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing messageId');
      expect(dto).toBeUndefined();
    });

    it('should fail with both type and messageId invalid', () => {
      // Arrange
      const data = {
        contentType: 'application/json',
        type: 123,
        messageId: 456,
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      expect(errors.length).toBe(2);
      expect(errors).toContain('Invalid or missing type');
      expect(errors).toContain('Invalid or missing messageId');
      expect(dto).toBeUndefined();
    });

    it('should accept empty string for type', () => {
      // Arrange
      const data = {
        type: '',
        messageId: 'msg-123',
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      // Empty strings are not validated, only undefined or non-string types are invalid
      expect(errors).toHaveLength(0);
    });

    it('should accept empty string for messageId', () => {
      // Arrange
      const data = {
        type: 'test.event',
        messageId: '',
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      // Empty strings are not validated, only undefined or non-string types are invalid
      expect(errors).toHaveLength(0);
    });

    it('should accept undefined for optional properties', () => {
      // Arrange
      const data = {
        contentType: undefined,
        contentEncoding: undefined,
        headers: undefined,
        deliveryMode: undefined,
        priority: undefined,
        correlationId: undefined,
        replyTo: undefined,
        expiration: undefined,
        timestamp: undefined,
        userId: undefined,
        appId: undefined,
        clusterId: undefined,
        type: 'test.event',
        messageId: 'msg-123',
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.contentType).toBeUndefined();
      expect(dto!.headers).toBeUndefined();
      expect(dto!.clusterId).toBeUndefined();
    });

    it('should accept null for optional properties', () => {
      // Arrange
      const data = {
        contentType: null,
        headers: null,
        type: 'test.event',
        messageId: 'msg-123',
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.contentType).toBeNull();
      expect(dto!.headers).toBeNull();
    });

    it('should preserve complex header objects', () => {
      // Arrange
      const complexHeaders = {
        'x-auth': 'Bearer token',
        'x-trace-id': 'trace-123',
        'x-nested': { key: 'value' },
        'x-array': [1, 2, 3],
      };
      const data = {
        headers: complexHeaders,
        type: 'test.event',
        messageId: 'msg-123',
      };

      // Act
      const [errors, dto] = MessagePropertiesDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.headers).toEqual(complexHeaders);
    });
  });
});
