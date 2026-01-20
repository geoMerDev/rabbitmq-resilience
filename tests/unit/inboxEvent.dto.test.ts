/**
 * Tests unitarios completos para InboxEventDto
 * Coverage: create, update, validate, mapToDto
 */

import { InboxEventDto } from '@/domain/dtos/eventManager/inboxEvent.dto';
import { v4 as uuidv4 } from 'uuid';

describe('InboxEventDto', () => {
  describe('create', () => {
    it('should create a valid InboxEventDto', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: { 'x-test': 'value' },
        properties: { messageId: '123' },
        payload: { data: 'test' },
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.uuid).toBe(data.uuid);
      expect(dto!.type).toBe(data.type);
      expect(dto!.id).toBeNull();
    });

    it('should create dto with id set', () => {
      // Arrange
      const data = {
        id: 42,
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.id).toBe(42);
    });

    it('should fail with invalid uuid (empty string)', () => {
      // Arrange
      const data = {
        uuid: '',
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing properties');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid properties (not object)', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: 'invalid',
        payload: {},
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing payload');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid payload (not object)', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: 'invalid',
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing payload');
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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

      // Assert
      expect(errors.length).toBeGreaterThan(1);
      expect(dto).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update a valid InboxEventDto', () => {
      // Arrange
      const data = {
        id: 1,
        uuid: uuidv4(),
        type: 'test.event.updated',
        headers: { updated: true },
        properties: { version: 2 },
        payload: { data: 'updated' },
      };

      // Act
      const [errors, dto] = InboxEventDto.update(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.id).toBe(1);
      expect(dto!.uuid).toBe(data.uuid);
      expect(dto!.type).toBe(data.type);
    });

    it('should fail update with invalid id (string)', () => {
      // Arrange
      const data = {
        id: 'invalid',
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
      };

      // Act
      const [errors, dto] = InboxEventDto.update(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.update(data);

      // Assert
      expect(errors).toContain('Invalid id');
      expect(dto).toBeUndefined();
    });

    it('should fail update with id = null', () => {
      // Arrange
      const data = {
        id: null,
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
      };

      // Act
      const [errors, dto] = InboxEventDto.update(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.update(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.update(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

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
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
    });

    it('should accept arrays as objects (typeof check)', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: [],
        properties: [],
        payload: [],
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(Array.isArray(dto!.headers)).toBe(true);
    });

    it('should set id to null when not provided in create', () => {
      // Arrange
      const data = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
      };

      // Act
      const [errors, dto] = InboxEventDto.create(data);

      // Assert
      expect(dto!.id).toBeNull();
    });

    it('should preserve object content', () => {
      // Arrange
      const complexData = {
        uuid: uuidv4(),
        type: 'test.event',
        headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
        properties: { timestamp: Date.now(), priority: 'high' },
        payload: { user: { id: 1, name: 'John' }, action: 'create' },
      };

      // Act
      const [errors, dto] = InboxEventDto.create(complexData);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.headers).toEqual(complexData.headers);
      expect(dto!.properties).toEqual(complexData.properties);
      expect(dto!.payload).toEqual(complexData.payload);
    });

    it('should handle numeric id = 0 in update', () => {
      // Arrange
      const data = {
        id: 0,
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
      };

      // Act
      const [errors, dto] = InboxEventDto.update(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.id).toBe(0);
    });

    it('should handle large numeric id in update', () => {
      // Arrange
      const data = {
        id: 999999999,
        uuid: uuidv4(),
        type: 'test.event',
        headers: {},
        properties: {},
        payload: {},
      };

      // Act
      const [errors, dto] = InboxEventDto.update(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.id).toBe(999999999);
    });
  });
});
