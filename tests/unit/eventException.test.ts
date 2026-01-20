import { EventException } from '@/infrastructure/eventManager/eventException';

describe('EventException', () => {
  describe('EventException - Constructor', () => {
    it('should create an EventException with message, exceptionType, and additionalData', () => {
      const message = 'Test error message';
      const exceptionType = 'TestError';
      const additionalData = { userId: 123 };

      const exception = new EventException(message, exceptionType, additionalData);

      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe(exceptionType);
      expect(exception.additionalData).toEqual(additionalData);
    });

    it('should create an EventException with default empty additionalData', () => {
      const message = 'Test error message';
      const exceptionType = 'TestError';

      const exception = new EventException(message, exceptionType);

      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe(exceptionType);
      expect(exception.additionalData).toEqual({});
    });

    it('should extend Error class', () => {
      const exception = new EventException('Test', 'TestError');

      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(EventException);
    });

    it('should have a stack trace', () => {
      const exception = new EventException('Test', 'TestError');

      expect(exception.stackTrace).toBeDefined();
      expect(typeof exception.stackTrace).toBe('string');
    });

    it('should set failedAt timestamp', () => {
      const beforeCreation = new Date();
      const exception = new EventException('Test', 'TestError');
      const afterCreation = new Date();

      expect(exception.failedAt).toBeDefined();
      expect(exception.failedAt).toBeInstanceOf(Date);
      expect(exception.failedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(exception.failedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should handle complex additionalData', () => {
      const additionalData = {
        userId: 123,
        operation: 'create',
        timestamp: new Date(),
        nested: { key: 'value' },
        array: [1, 2, 3],
      };

      const exception = new EventException('Test', 'TestError', additionalData);

      expect(exception.additionalData).toEqual(additionalData);
    });

    it('should handle empty string message', () => {
      const exception = new EventException('', 'TestError');

      expect(exception.message).toBe('');
      expect(exception.exceptionType).toBe('TestError');
    });

    it('should handle empty string exceptionType', () => {
      const exception = new EventException('Message', '');

      expect(exception.message).toBe('Message');
      expect(exception.exceptionType).toBe('');
    });

    it('should handle special characters in message', () => {
      const message = 'Error: <script>alert("xss")</script> & "quotes"';
      const exception = new EventException(message, 'TestError');

      expect(exception.message).toBe(message);
    });

    it('should preserve additionalData reference', () => {
      const additionalData = { key: 'value' };
      const exception = new EventException('Test', 'TestError', additionalData);

      expect(exception.additionalData).toBe(additionalData);
    });
  });

  describe('EventException - exceptionDetail getter', () => {
    it('should return correctly formatted exception detail', () => {
      const message = 'Test error';
      const exceptionType = 'TestType';
      const additionalData = { userId: 123 };
      const exception = new EventException(message, exceptionType, additionalData);

      const detail = exception.exceptionDetail;

      expect(detail).toHaveProperty('message', message);
      expect(detail).toHaveProperty('exception_type', exceptionType);
      expect(detail).toHaveProperty('stack_trace');
      expect(detail).toHaveProperty('failed_at');
      expect(detail).toHaveProperty('additional_data', additionalData);
    });

    it('should convert failedAt to string in exceptionDetail', () => {
      const exception = new EventException('Test', 'TestError');
      const detail = exception.exceptionDetail;

      expect(typeof detail.failed_at).toBe('string');
      expect(detail.failed_at).toBeDefined();
      expect(detail.failed_at.length).toBeGreaterThan(0);
    });

    it('should include stack trace in exceptionDetail', () => {
      const exception = new EventException('Test', 'TestError');
      const detail = exception.exceptionDetail;

      expect(detail.stack_trace).toBeDefined();
      expect(typeof detail.stack_trace).toBe('string');
      expect(detail.stack_trace.length).toBeGreaterThan(0);
    });

    it('should not modify original exception when accessing exceptionDetail', () => {
      const exception = new EventException('Test', 'TestError', { original: true });
      const detail1 = exception.exceptionDetail;
      const detail2 = exception.exceptionDetail;

      expect(detail1).toEqual(detail2);
      expect(exception.additionalData).toEqual({ original: true });
    });

    it('should handle empty additionalData in exceptionDetail', () => {
      const exception = new EventException('Test', 'TestError');
      const detail = exception.exceptionDetail;

      expect(detail.additional_data).toEqual({});
    });

    it('should use snake_case for property names in exceptionDetail', () => {
      const exception = new EventException('Test', 'TestError', { key: 'value' });
      const detail = exception.exceptionDetail;

      expect(detail).toHaveProperty('exception_type');
      expect(detail).toHaveProperty('stack_trace');
      expect(detail).toHaveProperty('failed_at');
      expect(detail).toHaveProperty('additional_data');
      expect(detail).not.toHaveProperty('exceptionType');
      expect(detail).not.toHaveProperty('stackTrace');
      expect(detail).not.toHaveProperty('failedAt');
      expect(detail).not.toHaveProperty('additionalData');
    });
  });

  describe('EventException - badRequest static method', () => {
    it('should create EventException with BadRequest type', () => {
      const message = 'Invalid request';
      const exception = EventException.badRequest(message);

      expect(exception).toBeInstanceOf(EventException);
      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('BadRequest');
    });

    it('should create EventException with BadRequest type and additionalData', () => {
      const message = 'Invalid request';
      const additionalData = { field: 'email', value: 'invalid@' };
      const exception = EventException.badRequest(message, additionalData);

      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('BadRequest');
      expect(exception.additionalData).toEqual(additionalData);
    });

    it('should create EventException with default additionalData', () => {
      const exception = EventException.badRequest('Invalid request');

      expect(exception.additionalData).toEqual({});
    });
  });

  describe('EventException - unauthorized static method', () => {
    it('should create EventException with Unauthorized type', () => {
      const message = 'Unauthorized access';
      const exception = EventException.unauthorized(message);

      expect(exception).toBeInstanceOf(EventException);
      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('Unauthorized');
    });

    it('should create EventException with Unauthorized type and additionalData', () => {
      const message = 'Unauthorized access';
      const additionalData = { userId: 123, action: 'delete' };
      const exception = EventException.unauthorized(message, additionalData);

      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('Unauthorized');
      expect(exception.additionalData).toEqual(additionalData);
    });
  });

  describe('EventException - forbidden static method', () => {
    it('should create EventException with Forbidden type', () => {
      const message = 'Access forbidden';
      const exception = EventException.forbidden(message);

      expect(exception).toBeInstanceOf(EventException);
      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('Forbidden');
    });

    it('should create EventException with Forbidden type and additionalData', () => {
      const message = 'Access forbidden';
      const additionalData = { resource: 'admin-panel', role: 'user' };
      const exception = EventException.forbidden(message, additionalData);

      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('Forbidden');
      expect(exception.additionalData).toEqual(additionalData);
    });
  });

  describe('EventException - notFound static method', () => {
    it('should create EventException with NotFound type', () => {
      const message = 'Resource not found';
      const exception = EventException.notFound(message);

      expect(exception).toBeInstanceOf(EventException);
      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('NotFound');
    });

    it('should create EventException with NotFound type and additionalData', () => {
      const message = 'Resource not found';
      const additionalData = { resourceId: 123, resourceType: 'User' };
      const exception = EventException.notFound(message, additionalData);

      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('NotFound');
      expect(exception.additionalData).toEqual(additionalData);
    });
  });

  describe('EventException - internalServer static method', () => {
    it('should create EventException with InternalServer type', () => {
      const exception = EventException.internalServer();

      expect(exception).toBeInstanceOf(EventException);
      expect(exception.message).toBe('Internal error');
      expect(exception.exceptionType).toBe('InternalServer');
    });

    it('should create EventException with custom message', () => {
      const message = 'Database connection failed';
      const exception = EventException.internalServer(message);

      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('InternalServer');
    });

    it('should create EventException with InternalServer type and additionalData', () => {
      const message = 'Database connection failed';
      const additionalData = { dbError: 'timeout', connection: 'postgresql' };
      const exception = EventException.internalServer(message, additionalData);

      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('InternalServer');
      expect(exception.additionalData).toEqual(additionalData);
    });

    it('should have default message when called without arguments', () => {
      const exception = EventException.internalServer();

      expect(exception.message).toBe('Internal error');
    });
  });

  describe('EventException - transactionError static method', () => {
    it('should create EventException with TransactionError type', () => {
      const reason = 'Duplicate key error';
      const exception = EventException.transactionError(reason);

      expect(exception).toBeInstanceOf(EventException);
      expect(exception.message).toBe(`Transaction failed: ${reason}`);
      expect(exception.exceptionType).toBe('TransactionError');
    });

    it('should prepend Transaction failed: to the message', () => {
      const reason = 'Rollback triggered';
      const exception = EventException.transactionError(reason);

      expect(exception.message).toBe('Transaction failed: Rollback triggered');
    });

    it('should create EventException with TransactionError type and additionalData', () => {
      const reason = 'Constraint violation';
      const additionalData = { table: 'users', constraint: 'unique_email' };
      const exception = EventException.transactionError(reason, additionalData);

      expect(exception.message).toBe(`Transaction failed: ${reason}`);
      expect(exception.exceptionType).toBe('TransactionError');
      expect(exception.additionalData).toEqual(additionalData);
    });

    it('should handle empty reason', () => {
      const exception = EventException.transactionError('');

      expect(exception.message).toBe('Transaction failed: ');
      expect(exception.exceptionType).toBe('TransactionError');
    });
  });

  describe('EventException - missingAttribute static method', () => {
    it('should create EventException with MissingAttribute type', () => {
      const attribute = 'email';
      const from = 'UserDTO';
      const exception = EventException.missingAttribute(attribute, from);

      expect(exception).toBeInstanceOf(EventException);
      expect(exception.message).toBe(`Missing attribute: ${attribute} from ${from}`);
      expect(exception.exceptionType).toBe('MissingAttribute');
    });

    it('should format message with attribute and source', () => {
      const exception = EventException.missingAttribute('userId', 'CreateUserRequest');

      expect(exception.message).toBe('Missing attribute: userId from CreateUserRequest');
    });

    it('should create EventException with MissingAttribute type and additionalData', () => {
      const attribute = 'phone';
      const from = 'UserProfile';
      const additionalData = { requiredFields: ['email', 'phone', 'name'] };
      const exception = EventException.missingAttribute(attribute, from, additionalData);

      expect(exception.message).toBe(`Missing attribute: ${attribute} from ${from}`);
      expect(exception.exceptionType).toBe('MissingAttribute');
      expect(exception.additionalData).toEqual(additionalData);
    });

    it('should handle special characters in attribute and from', () => {
      const exception = EventException.missingAttribute('user.contact.email', 'request[data]');

      expect(exception.message).toBe('Missing attribute: user.contact.email from request[data]');
    });
  });

  describe('EventException - actionNotAllowed static method', () => {
    it('should create EventException with ActionNotAllowed type', () => {
      const message = 'Cannot delete admin users';
      const exception = EventException.actionNotAllowed(message);

      expect(exception).toBeInstanceOf(EventException);
      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('ActionNotAllowed');
    });

    it('should create EventException with ActionNotAllowed type and additionalData', () => {
      const message = 'Cannot modify archived records';
      const additionalData = { recordId: 456, status: 'archived', action: 'update' };
      const exception = EventException.actionNotAllowed(message, additionalData);

      expect(exception.message).toBe(message);
      expect(exception.exceptionType).toBe('ActionNotAllowed');
      expect(exception.additionalData).toEqual(additionalData);
    });
  });

  describe('EventException - Integration and edge cases', () => {
    it('should be throwable and catchable', () => {
      expect(() => {
        throw EventException.badRequest('Invalid input');
      }).toThrow(EventException);
    });

    it('should be catchable as Error', () => {
      expect(() => {
        throw EventException.unauthorized('Access denied');
      }).toThrow(Error);
    });

    it('should maintain all properties after throw and catch', () => {
      let caughtException: EventException | null = null;

      try {
        throw EventException.internalServer('Server error', { errorCode: 500 });
      } catch (e) {
        caughtException = e as EventException;
      }

      expect(caughtException).not.toBeNull();
      expect(caughtException!.message).toBe('Server error');
      expect(caughtException!.exceptionType).toBe('InternalServer');
      expect(caughtException!.additionalData).toEqual({ errorCode: 500 });
    });

    it('should preserve exception detail after throw and catch', () => {
      let caughtDetail: any = null;

      try {
        throw EventException.notFound('User not found', { userId: 789 });
      } catch (e) {
        caughtDetail = (e as EventException).exceptionDetail;
      }

      expect(caughtDetail.message).toBe('User not found');
      expect(caughtDetail.exception_type).toBe('NotFound');
      expect(caughtDetail.additional_data).toEqual({ userId: 789 });
    });

    it('should create multiple exceptions with independent states', () => {
      const exc1 = EventException.badRequest('Error 1', { id: 1 });
      const exc2 = EventException.unauthorized('Error 2', { id: 2 });
      const exc3 = EventException.forbidden('Error 3', { id: 3 });

      expect(exc1.message).toBe('Error 1');
      expect(exc2.message).toBe('Error 2');
      expect(exc3.message).toBe('Error 3');

      expect(exc1.exceptionType).toBe('BadRequest');
      expect(exc2.exceptionType).toBe('Unauthorized');
      expect(exc3.exceptionType).toBe('Forbidden');

      expect(exc1.additionalData.id).toBe(1);
      expect(exc2.additionalData.id).toBe(2);
      expect(exc3.additionalData.id).toBe(3);
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const exception = EventException.badRequest(longMessage);

      expect(exception.message).toBe(longMessage);
      expect(exception.message.length).toBe(10000);
    });

    it('should handle deeply nested additionalData', () => {
      const additionalData = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep',
                },
              },
            },
          },
        },
      };

      const exception = EventException.internalServer('Error', additionalData);

      expect(exception.additionalData.level1.level2.level3.level4.level5.value).toBe('deep');
    });

    it('should handle null and undefined in additionalData', () => {
      const additionalData = {
        nullValue: null,
        undefinedValue: undefined,
        validValue: 'present',
      };

      const exception = EventException.badRequest('Error', additionalData);

      expect(exception.additionalData.nullValue).toBeNull();
      expect(exception.additionalData.undefinedValue).toBeUndefined();
      expect(exception.additionalData.validValue).toBe('present');
    });

    it('should have consistent failedAt timestamps for exceptions created in sequence', () => {
      const exc1 = EventException.badRequest('Error 1');
      const exc2 = EventException.badRequest('Error 2');

      expect(exc1.failedAt <= exc2.failedAt).toBe(true);
    });

    it('should include exception name in stack trace', () => {
      const exception = EventException.transactionError('DB Error');

      expect(exception.stackTrace).toBeDefined();
      expect(typeof exception.stackTrace).toBe('string');
      expect(exception.stackTrace.length).toBeGreaterThan(0);
    });
  });

  describe('EventException - Type safety', () => {
    it('should have correct type properties', () => {
      const exception = EventException.missingAttribute('email', 'User');

      expect(typeof exception.message).toBe('string');
      expect(typeof exception.exceptionType).toBe('string');
      expect(typeof exception.stackTrace).toBe('string');
      expect(exception.failedAt instanceof Date).toBe(true);
      expect(typeof exception.additionalData).toBe('object');
    });

    it('should return consistent types from static methods', () => {
      const exc1 = EventException.badRequest('Error');
      const exc2 = EventException.unauthorized('Error');
      const exc3 = EventException.actionNotAllowed('Error');

      expect(exc1).toBeInstanceOf(EventException);
      expect(exc2).toBeInstanceOf(EventException);
      expect(exc3).toBeInstanceOf(EventException);
    });
  });
});
