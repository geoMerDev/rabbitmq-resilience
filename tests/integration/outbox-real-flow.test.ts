/**
 * Test de integración SIMPLIFICADO
 * Prueba el flujo real: Publicar → Guardar en BD
 */

import { v4 as uuidv4 } from 'uuid';
import { OutboxEventDatasourceImpl } from '../../src/infrastructure/datasources/eventManager/outboxEvent.datasource.impl';
import { withCleanDatabase } from '../helpers/database.helper';
import { DbSequelize } from '../../src/infrastructure/database/init';

describe('Integration: Outbox Real Flow', () => {
  const getDb = withCleanDatabase();
  let datasource: OutboxEventDatasourceImpl;

  beforeAll(async () => {
    const sequelize = getDb();
    await DbSequelize(sequelize);
    datasource = new OutboxEventDatasourceImpl();
  });

  describe('Datasource Operations', () => {
    it('should save event with attempts = 0', async () => {
      // Simular lo que hace publishToExchangeWithConfirmation
      const eventId = uuidv4();
      const payload = { test: 'data' };
      const properties = {
        messageId: eventId,
        type: 'test.event',
        contentType: 'application/json',
      };

      const deliveryInfo = {
        timestamp: new Date(),
        host: 'localhost',
        virtualHost: '/',
        destinationType: 'exchange' as const,
        destinationName: 'test.exchange',
        routingKey: 'test.key',
      };

      // Simular el DTO que se pasa a registerFromRabbitMQMessageDto
      const mockEvent = {
        content: Buffer.from(JSON.stringify(payload)),
        properties,
        fields: {
          deliveryTag: 0,
          redelivered: false,
          exchange: 'test.exchange',
          routingKey: 'test.key',
        },
      };

      // Act - Lo mismo que hace RabbitMQ.publishToExchangeWithConfirmation
      await datasource.registerFromRabbitMQMessageDto(mockEvent as any, deliveryInfo);

      // Assert
      const saved = await datasource.getByUuid(eventId);
      
      expect(saved).toBeDefined();
      expect(saved!.uuid).toBe(eventId);
      expect(saved!.attempts).toBe(0);
      expect(saved!.payload).toEqual(payload);
      // Verificar deliveryInfo
      expect(saved!.deliveryInfo).toBeDefined();
      const info = saved!.deliveryInfo as any;
      expect(info.destinationType).toBe('exchange');
      expect(info.destinationName).toBe('test.exchange');
      expect(info.routingKey).toBe('test.key');
    });

    it('should save with deliveryInfo = null when publish fails', async () => {
      const eventId = uuidv4();
      const properties = {
        messageId: eventId,
        type: 'test.failed',
      };

      const mockEvent = {
        content: Buffer.from('{}'),
        properties,
        fields: {
          deliveryTag: 0,
          redelivered: false,
          exchange: '',
          routingKey: '',
        },
      };

      // Act - Simular fallo (deliveryInfo = null)
      await datasource.registerFromRabbitMQMessageDto(mockEvent as any, null);

      // Assert
      const saved = await datasource.getByUuid(eventId);
      
      expect(saved).toBeDefined();
      expect(saved!.attempts).toBe(0);
      expect(saved!.deliveryInfo).toBeNull();
    });

    it('should get all events with attempts = 0', async () => {
      // Arrange - Crear varios eventos
      const events = await Promise.all([1, 2, 3].map(async (i) => {
        const id = uuidv4();
        const mockEvent = {
          content: Buffer.from(JSON.stringify({ id: i })),
          properties: {
            messageId: id,
            type: `test.event.${i}`,
          },
          fields: {
            deliveryTag: 0,
            redelivered: false,
            exchange: 'test',
            routingKey: 'test',
          },
        };

        await datasource.registerFromRabbitMQMessageDto(mockEvent as any, null);
        return id;
      }));

      // Act
      const pending = await datasource.getByAttemptsZero();

      // Assert
      expect(pending.length).toBeGreaterThanOrEqual(3);
      expect(pending.every(e => e.attempts === 0)).toBe(true);
    });
  });
});
