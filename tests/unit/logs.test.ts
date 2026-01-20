import { Logs } from '@/infrastructure/utils/logs';
import { ShowLogs } from '@/domain/interfaces/rabbitMQResilienceConfig';

describe('Logs', () => {
  let originalConsole: any;

  beforeEach(() => {
    // Save original console methods
    originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
      trace: console.trace,
      time: console.time,
      timeEnd: console.timeEnd,
    };

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.trace = jest.fn();
    console.time = jest.fn();
    console.timeEnd = jest.fn();
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.trace = originalConsole.trace;
    console.time = originalConsole.time;
    console.timeEnd = originalConsole.timeEnd;
  });

  describe('Logs - Configuration', () => {
    it('should have a config property', () => {
      expect(Logs).toHaveProperty('config');
    });

    it('should set default config', () => {
      const defaultConfig = Logs.setDefaultConfig();

      expect(defaultConfig).toHaveProperty('log', true);
      expect(defaultConfig).toHaveProperty('error', true);
      expect(defaultConfig).toHaveProperty('warn', true);
      expect(defaultConfig).toHaveProperty('info', true);
      expect(defaultConfig).toHaveProperty('debug', true);
      expect(defaultConfig).toHaveProperty('trace', true);
      expect(defaultConfig).toHaveProperty('time', true);
      expect(defaultConfig).toHaveProperty('timeEnd', true);
    });

    it('should have all log levels in default config', () => {
      const defaultConfig = Logs.setDefaultConfig();

      expect(Object.keys(defaultConfig)).toContain('log');
      expect(Object.keys(defaultConfig)).toContain('error');
      expect(Object.keys(defaultConfig)).toContain('warn');
      expect(Object.keys(defaultConfig)).toContain('info');
      expect(Object.keys(defaultConfig)).toContain('debug');
      expect(Object.keys(defaultConfig)).toContain('trace');
      expect(Object.keys(defaultConfig)).toContain('time');
      expect(Object.keys(defaultConfig)).toContain('timeEnd');
    });

    it('should default config enable all logging', () => {
      const defaultConfig = Logs.setDefaultConfig();
      const values = Object.values(defaultConfig);

      expect(values.every(val => val === true)).toBe(true);
    });
  });

  describe('Logs - log method', () => {
    it('should call console.log when config.log is true', () => {
      Logs.config = { log: true } as ShowLogs;

      Logs.log('Test message');

      expect(console.log).toHaveBeenCalledWith('Test message');
    });

    it('should not call console.log when config.log is false', () => {
      Logs.config = { log: false } as ShowLogs;

      Logs.log('Test message');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should pass optional parameters to console.log', () => {
      Logs.config = { log: true } as ShowLogs;

      Logs.log('Message', { key: 'value' }, 123, 'extra');

      expect(console.log).toHaveBeenCalledWith('Message', { key: 'value' }, 123, 'extra');
    });

    it('should handle multiple optional parameters', () => {
      Logs.config = { log: true } as ShowLogs;
      const param1 = { data: 'test' };
      const param2 = [1, 2, 3];
      const param3 = 'string';

      Logs.log('Message', param1, param2, param3);

      expect(console.log).toHaveBeenCalledWith('Message', param1, param2, param3);
    });

    it('should handle empty string message', () => {
      Logs.config = { log: true } as ShowLogs;

      Logs.log('');

      expect(console.log).toHaveBeenCalledWith('');
    });
  });

  describe('Logs - error method', () => {
    it('should call console.error when config.error is true', () => {
      Logs.config = { error: true } as ShowLogs;

      Logs.error('Error message');

      expect(console.error).toHaveBeenCalledWith('Error message');
    });

    it('should not call console.error when config.error is false', () => {
      Logs.config = { error: false } as ShowLogs;

      Logs.error('Error message');

      expect(console.error).not.toHaveBeenCalled();
    });

    it('should pass optional parameters to console.error', () => {
      Logs.config = { error: true } as ShowLogs;

      Logs.error('Error', new Error('Test error'), { code: 500 });

      expect(console.error).toHaveBeenCalledWith('Error', new Error('Test error'), { code: 500 });
    });
  });

  describe('Logs - warn method', () => {
    it('should call console.warn when config.warn is true', () => {
      Logs.config = { warn: true } as ShowLogs;

      Logs.warn('Warning message');

      expect(console.warn).toHaveBeenCalledWith('Warning message');
    });

    it('should not call console.warn when config.warn is false', () => {
      Logs.config = { warn: false } as ShowLogs;

      Logs.warn('Warning message');

      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should pass optional parameters to console.warn', () => {
      Logs.config = { warn: true } as ShowLogs;

      Logs.warn('Warning', { severity: 'medium' });

      expect(console.warn).toHaveBeenCalledWith('Warning', { severity: 'medium' });
    });
  });

  describe('Logs - info method', () => {
    it('should call console.info when config.info is true', () => {
      Logs.config = { info: true } as ShowLogs;

      Logs.info('Info message');

      expect(console.info).toHaveBeenCalledWith('Info message');
    });

    it('should not call console.info when config.info is false', () => {
      Logs.config = { info: false } as ShowLogs;

      Logs.info('Info message');

      expect(console.info).not.toHaveBeenCalled();
    });

    it('should pass optional parameters to console.info', () => {
      Logs.config = { info: true } as ShowLogs;

      Logs.info('Info', { event: 'started' });

      expect(console.info).toHaveBeenCalledWith('Info', { event: 'started' });
    });
  });

  describe('Logs - debug method', () => {
    it('should call console.debug when config.debug is true', () => {
      Logs.config = { debug: true } as ShowLogs;

      Logs.debug('Debug message');

      expect(console.debug).toHaveBeenCalledWith('Debug message');
    });

    it('should not call console.debug when config.debug is false', () => {
      Logs.config = { debug: false } as ShowLogs;

      Logs.debug('Debug message');

      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should pass optional parameters to console.debug', () => {
      Logs.config = { debug: true } as ShowLogs;

      Logs.debug('Debug', { variable: 'value' });

      expect(console.debug).toHaveBeenCalledWith('Debug', { variable: 'value' });
    });
  });

  describe('Logs - trace method', () => {
    it('should call console.trace when config.trace is true', () => {
      Logs.config = { trace: true } as ShowLogs;

      Logs.trace('Trace message');

      expect(console.trace).toHaveBeenCalledWith('Trace message');
    });

    it('should not call console.trace when config.trace is false', () => {
      Logs.config = { trace: false } as ShowLogs;

      Logs.trace('Trace message');

      expect(console.trace).not.toHaveBeenCalled();
    });

    it('should pass optional parameters to console.trace', () => {
      Logs.config = { trace: true } as ShowLogs;

      Logs.trace('Trace', { stack: 'info' });

      expect(console.trace).toHaveBeenCalledWith('Trace', { stack: 'info' });
    });
  });

  describe('Logs - time method', () => {
    it('should call console.time when config.time is true', () => {
      Logs.config = { time: true } as ShowLogs;

      Logs.time('timer-label');

      expect(console.time).toHaveBeenCalledWith('timer-label');
    });

    it('should not call console.time when config.time is false', () => {
      Logs.config = { time: false } as ShowLogs;

      Logs.time('timer-label');

      expect(console.time).not.toHaveBeenCalled();
    });

    it('should handle different label names', () => {
      Logs.config = { time: true } as ShowLogs;

      Logs.time('operation-1');
      Logs.time('operation-2');
      Logs.time('performance-test');

      expect(console.time).toHaveBeenCalledWith('operation-1');
      expect(console.time).toHaveBeenCalledWith('operation-2');
      expect(console.time).toHaveBeenCalledWith('performance-test');
    });
  });

  describe('Logs - timeEnd method', () => {
    it('should call console.timeEnd when config.time is true', () => {
      Logs.config = { time: true } as ShowLogs;

      Logs.timeEnd('timer-label');

      expect(console.timeEnd).toHaveBeenCalledWith('timer-label');
    });

    it('should not call console.timeEnd when config.time is false', () => {
      Logs.config = { time: false } as ShowLogs;

      Logs.timeEnd('timer-label');

      expect(console.timeEnd).not.toHaveBeenCalled();
    });

    it('should handle different label names', () => {
      Logs.config = { time: true } as ShowLogs;

      Logs.timeEnd('operation-1');
      Logs.timeEnd('operation-2');

      expect(console.timeEnd).toHaveBeenCalledWith('operation-1');
      expect(console.timeEnd).toHaveBeenCalledWith('operation-2');
    });

    it('should work with time and timeEnd together', () => {
      Logs.config = { time: true } as ShowLogs;

      Logs.time('perf-test');
      // Simulate some work
      Logs.timeEnd('perf-test');

      expect(console.time).toHaveBeenCalledWith('perf-test');
      expect(console.timeEnd).toHaveBeenCalledWith('perf-test');
    });
  });

  describe('Logs - Selective logging', () => {
    it('should respect different config states for different methods', () => {
      Logs.config = {
        log: true,
        error: false,
        warn: true,
        info: false,
        debug: true,
        trace: false,
        time: true,
      } as ShowLogs;

      Logs.log('message');
      Logs.error('error');
      Logs.warn('warning');
      Logs.info('info');
      Logs.debug('debug');
      Logs.trace('trace');

      expect(console.log).toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.debug).toHaveBeenCalled();
      expect(console.trace).not.toHaveBeenCalled();
    });

    it('should disable all logging when config is all false', () => {
      Logs.config = {
        log: false,
        error: false,
        warn: false,
        info: false,
        debug: false,
        trace: false,
        time: false,
      } as ShowLogs;

      Logs.log('message');
      Logs.error('error');
      Logs.warn('warning');
      Logs.info('info');
      Logs.debug('debug');
      Logs.trace('trace');
      Logs.time('label');
      Logs.timeEnd('label');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.trace).not.toHaveBeenCalled();
      expect(console.time).not.toHaveBeenCalled();
      expect(console.timeEnd).not.toHaveBeenCalled();
    });

    it('should enable all logging when config is all true', () => {
      Logs.config = {
        log: true,
        error: true,
        warn: true,
        info: true,
        debug: true,
        trace: true,
        time: true,
      } as ShowLogs;

      Logs.log('message');
      Logs.error('error');
      Logs.warn('warning');
      Logs.info('info');
      Logs.debug('debug');
      Logs.trace('trace');
      Logs.time('label');
      Logs.timeEnd('label');

      expect(console.log).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.debug).toHaveBeenCalled();
      expect(console.trace).toHaveBeenCalled();
      expect(console.time).toHaveBeenCalled();
      expect(console.timeEnd).toHaveBeenCalled();
    });
  });

  describe('Logs - Special cases', () => {
    it('should handle very long messages', () => {
      Logs.config = { log: true } as ShowLogs;
      const longMessage = 'A'.repeat(10000);

      Logs.log(longMessage);

      expect(console.log).toHaveBeenCalledWith(longMessage);
    });

    it('should handle objects with circular references', () => {
      Logs.config = { log: true } as ShowLogs;
      const obj: any = { name: 'test' };
      obj.self = obj; // Create circular reference

      Logs.log('Object:', obj);

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle null and undefined parameters', () => {
      Logs.config = { log: true } as ShowLogs;

      Logs.log('Message', null, undefined);

      expect(console.log).toHaveBeenCalledWith('Message', null, undefined);
    });

    it('should handle arrays of different types', () => {
      Logs.config = { log: true } as ShowLogs;

      Logs.log('Array:', [1, 'string', { obj: true }, null, undefined]);

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle empty optional parameters', () => {
      Logs.config = { log: true } as ShowLogs;

      Logs.log('Message');

      expect(console.log).toHaveBeenCalledWith('Message');
    });
  });

  describe('Logs - Static nature', () => {
    it('should maintain state across method calls', () => {
      Logs.config = { log: true, error: true } as ShowLogs;

      Logs.log('First message');
      Logs.error('Error message');

      expect(console.log).toHaveBeenCalledWith('First message');
      expect(console.error).toHaveBeenCalledWith('Error message');
    });

    it('should allow changing config dynamically', () => {
      Logs.config = { log: true } as ShowLogs;
      Logs.log('Message 1');

      Logs.config = { log: false } as ShowLogs;
      Logs.log('Message 2');

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Message 1');
    });

    it('should work as a static utility class', () => {
      expect(typeof Logs.log).toBe('function');
      expect(typeof Logs.error).toBe('function');
      expect(typeof Logs.warn).toBe('function');
      expect(typeof Logs.info).toBe('function');
      expect(typeof Logs.debug).toBe('function');
      expect(typeof Logs.trace).toBe('function');
      expect(typeof Logs.time).toBe('function');
      expect(typeof Logs.timeEnd).toBe('function');
      expect(typeof Logs.setDefaultConfig).toBe('function');
    });
  });

  describe('Logs - Performance considerations', () => {
    it('should not create console output when disabled', () => {
      Logs.config = { log: false } as ShowLogs;

      for (let i = 0; i < 1000; i++) {
        Logs.log('Message', i);
      }

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should skip parameter processing when disabled', () => {
      Logs.config = { error: false } as ShowLogs;
      const complexObject = { nested: { deep: { data: 'value' } } };

      Logs.error('Error', complexObject);

      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
