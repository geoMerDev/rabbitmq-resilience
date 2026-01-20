/**
 * Test básico - Verificar configuración
 */

describe('Basic Configuration Test', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have Jest configured', () => {
    expect(jest).toBeDefined();
  });

  it('should be able to import uuid', () => {
    const { v4 } = require('uuid');
    const uuid = v4();
    expect(uuid).toBeDefined();
    expect(typeof uuid).toBe('string');
  });

  it('should be able to use Buffer', () => {
    const buffer = Buffer.from('test');
    expect(buffer.toString()).toBe('test');
  });
});
