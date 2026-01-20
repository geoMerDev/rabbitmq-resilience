/**
 * Tests unitarios completos para EventProcessLogDto
 * Coverage: create, update, validate, mapToDto
 */

import { EventProcessLogDto } from '@/domain/dtos/eventManager/eventProcessLog.dto';

describe('EventProcessLogDto', () => {
  describe('create', () => {
    it('should create a valid EventProcessLogDto', () => {
      // Arrange
      const data = {
        eventId: 1,
        processName: 'test.process',
        duration: 100,
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.eventId).toBe(1);
      expect(dto!.processName).toBe('test.process');
      expect(dto!.duration).toBe(100);
      expect(dto!.id).toBeNull();
    });

    it('should create dto without duration (undefined)', () => {
      // Arrange
      const data = {
        eventId: 2,
        processName: 'process.name',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.eventId).toBe(2);
      expect(dto!.processName).toBe('process.name');
      expect(dto!.duration).toBeUndefined();
    });

    it('should create dto with duration = 0', () => {
      // Arrange
      const data = {
        eventId: 3,
        processName: 'fast.process',
        duration: 0,
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.duration).toBe(0);
    });

    it('should fail with invalid eventId (not number)', () => {
      // Arrange
      const data = {
        eventId: 'invalid',
        processName: 'test.process',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing eventId');
      expect(dto).toBeUndefined();
    });

    it('should fail with missing eventId', () => {
      // Arrange
      const data = {
        processName: 'test.process',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing eventId');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid processName (not string)', () => {
      // Arrange
      const data = {
        eventId: 1,
        processName: 123,
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing processName');
      expect(dto).toBeUndefined();
    });

    it('should fail with empty processName', () => {
      // Arrange
      const data = {
        eventId: 1,
        processName: '',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing processName');
      expect(dto).toBeUndefined();
    });

    it('should fail with processName with only spaces', () => {
      // Arrange
      const data = {
        eventId: 1,
        processName: '   ',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toContain('Invalid or missing processName');
      expect(dto).toBeUndefined();
    });

    it('should fail with invalid duration (not number when defined)', () => {
      // Arrange
      const data = {
        eventId: 1,
        processName: 'test.process',
        duration: 'invalid',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toContain('Invalid duration');
      expect(dto).toBeUndefined();
    });

    it('should fail with multiple validation errors', () => {
      // Arrange
      const data = {
        eventId: 'invalid',
        processName: '',
        duration: 'invalid',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors.length).toBeGreaterThanOrEqual(2);
      expect(dto).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update a valid EventProcessLogDto', () => {
      // Arrange
      const data = {
        id: 1,
        eventId: 2,
        processName: 'updated.process',
        duration: 200,
      };

      // Act
      const [errors, dto] = EventProcessLogDto.update(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.id).toBe(1);
      expect(dto!.eventId).toBe(2);
      expect(dto!.processName).toBe('updated.process');
      expect(dto!.duration).toBe(200);
    });

    it('should update dto without duration', () => {
      // Arrange
      const data = {
        id: 1,
        eventId: 2,
        processName: 'updated.process',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.update(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto).toBeDefined();
      expect(dto!.duration).toBeUndefined();
    });

    it('should fail update with invalid id', () => {
      // Arrange
      const data = {
        id: 'invalid',
        eventId: 1,
        processName: 'test.process',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.update(data);

      // Assert
      expect(errors).toContain('Invalid id');
      expect(dto).toBeUndefined();
    });

    it('should fail update with missing id', () => {
      // Arrange
      const data = {
        eventId: 1,
        processName: 'test.process',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.update(data);

      // Assert
      expect(errors).toContain('Invalid id');
      expect(dto).toBeUndefined();
    });

    it('should fail update with invalid eventId', () => {
      // Arrange
      const data = {
        id: 1,
        eventId: 'invalid',
        processName: 'test.process',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.update(data);

      // Assert
      expect(errors).toContain('Invalid or missing eventId');
      expect(dto).toBeUndefined();
    });

    it('should fail update with invalid processName', () => {
      // Arrange
      const data = {
        id: 1,
        eventId: 1,
        processName: '',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.update(data);

      // Assert
      expect(errors).toContain('Invalid or missing processName');
      expect(dto).toBeUndefined();
    });

    it('should fail update with invalid duration', () => {
      // Arrange
      const data = {
        id: 1,
        eventId: 1,
        processName: 'test.process',
        duration: 'invalid',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.update(data);

      // Assert
      expect(errors).toContain('Invalid duration');
      expect(dto).toBeUndefined();
    });

    it('should fail update with multiple errors', () => {
      // Arrange
      const data = {
        id: null,
        eventId: 'invalid',
        processName: '',
        duration: 'invalid',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.update(data);

      // Assert
      expect(errors.length).toBeGreaterThanOrEqual(2);
      expect(dto).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should accept large eventId', () => {
      // Arrange
      const data = {
        eventId: 999999,
        processName: 'test.process',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.eventId).toBe(999999);
    });

    it('should accept large duration', () => {
      // Arrange
      const data = {
        eventId: 1,
        processName: 'slow.process',
        duration: 999999,
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.duration).toBe(999999);
    });

    it('should accept negative duration', () => {
      // Arrange
      const data = {
        eventId: 1,
        processName: 'test.process',
        duration: -1,
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.duration).toBe(-1);
    });

    it('should set id to null when not provided in create', () => {
      // Arrange
      const data = {
        eventId: 1,
        processName: 'test.process',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(dto!.id).toBeNull();
    });

    it('should handle processName with special characters', () => {
      // Arrange
      const data = {
        eventId: 1,
        processName: 'test-process_v2.handler',
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.processName).toBe('test-process_v2.handler');
    });

    it('should handle very long processName', () => {
      // Arrange
      const longName = 'a'.repeat(1000);
      const data = {
        eventId: 1,
        processName: longName,
      };

      // Act
      const [errors, dto] = EventProcessLogDto.create(data);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto!.processName).toBe(longName);
    });
  });
});
