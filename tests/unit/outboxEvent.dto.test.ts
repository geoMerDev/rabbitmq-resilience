/**
 * Tests unitarios completos para OutboxEventDto
 * Coverage: create, update, validate, mapToDto
 */

import { OutboxEventDto } from '@/domain/dtos/eventManager/outboxEvent.dto';
import { v4 as uuidv4 } from 'uuid';

describe('OutboxEventDto', () => {
  describe('create', () => {
    it('should create a valid OutboxEventDto', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: { 'x-test': 'value' },
        properties: { messageId: '123' },
        payload: { data: 'test' },
        deliveryInfo: null,
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.uuid).toBe(data.uuid);
      expect(dto!.type).toBe(data.type);
      expect(dto!.attempts).toBe(0);
      expect(dto!.id).toBeNull();
    });

    it('should create dto with deliveryInfo', () => {
      // Arrange
      const deliveryInfo = {
        timestamp: new Date(),
        host: 'localhost',
        virtualHost: '/',
        destinationType: 'exchange',
        destinationName: 'test.exchange',
      };

      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        deliveryInfo,
        attempts: 1,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.deliveryInfo).toBe(deliveryInfo);
      expect(dto!.attempts).toBe(1);
    });

    it('should fail with invalid uuid (empty string)', () => {
      // Arrange
      const data = {
        uuid: '',
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing uuid');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid uuid (not string)', () => {
      // Arrange
      const data = {
        uuid: 123,
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing uuid');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid type (empty string)', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: '',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing type');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid type (not string)', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 123,
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing type');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid headers (null)', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: null,
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing headers');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid headers (not object)', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: 'invalid',
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing headers');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid properties (null)', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: null,
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing properties');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid payload (null)', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: null,
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing payload');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid attempts (not number)', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: '0',
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing attempts');
      expect(dto).toBeUndefined();
    });

    it('should fail with multiple validation errors', () => {
      // Arrange
      const data = {
        uuid: '',
        type: '',
        headers: null,
        properties: null,
        payload: null,
        attempts: 'invalid',
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors.length).toBeGreaterThan(1);
      expect(dto).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update a valid OutboxEventDto', () => {
      // Arrange
      const data = {
        id: 1,
        uuid: uuidv4(),
        type: 'test.event.updated',
        headers: { updated: true },
        properties: { version: 2 },
        payload: { data: 'updated' },
        deliveryInfo: { host: 'localhost' },
        attempts: 3,
      };

      // Act
      const [errors, dto] = OutboxEventDto.update(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.id).toBe(1);
      expect(dto!.uuid).toBe(data.uuid);
      expect(dto!.type).toBe(data.type);
      expect(dto!.attempts).toBe(3);
    });

    it('should fail update with invalid id', () => {
      // Arrange
      const data = {
        id: 'invalid',
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.update(data);

      // Assert
      expect(errors).toContain('Invalid id');
      expect(dto).toBeUndefined();
    });

    it('should fail update with missing id', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.update(data);

      // Assert
      expect(errors).toContain('Invalid id');
      expect(dto).toBeUndefined();
    });

    it('should fail update with invalid uuid', () => {
      // Arrange
      const data = {
        id: 1,
        uuid: '',
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.update(data);

      // Assert
      expect(errors).toContain('Invalid or missing uuid');
      expect(dto).toBeUndefined();
    });

    it('should fail update with multiple errors', () => {
      // Arrange
      const data = {
        id: null,
        uuid: '',
        type: '',
        headers: null,
        properties: null,
        payload: null,
        attempts: 'invalid',
      };

      // Act
      const [errors, dto] = OutboxEventDto.update(data);

      // Assert
      expect(errors.length).toBeGreaterThan(1);
      expect(dto).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle uuid with only spaces', () => {
      // Arrange
      const data = {
        uuid: '   ',
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing uuid');
      expect(dto).toBeUndefined();
    });

    it('should handle type with only spaces', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: '   ',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing type');
      expect(dto).toBeUndefined();
    });

    it('should accept empty objects for headers, properties, payload', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
    });

    it('should accept attempts = 0', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.attempts).toBe(0);
    });

    it('should accept large attempts number', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 999,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.attempts).toBe(999);
    });

    it('should set id to null when not provided in create', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(dto!.id).toBeNull();
    });

    it('should set deliveryInfo to null when not provided', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
        attempts: 0,
      };

      // Act
      const [errors, dto] = OutboxEventDto.create(data);

      // Assert
      expect(dto!.deliveryInfo).toBeNull();
    });
  });
});
