/**
 * Mock de RabbitMQ para tests
 * Simula comportamiento de amqplib sin conexión real
 */

export class MockChannel {
  private queues: Map<string, any[]> = new Map();
  private exchanges: Map<string, any> = new Map();
  
  async assertQueue(queue: string, options?: any) {
    if (!this.queues.has(queue)) {
      this.queues.set(queue, []);
    }
    return { queue, messageCount: 0, consumerCount: 0 };
  }

  async assertExchange(exchange: string, type: string, options?: any) {
    this.exchanges.set(exchange, { type, options });
    return { exchange };
  }

  async bindQueue(queue: string, exchange: string, routingKey: string) {
    return true;
  }

  async prefetch(count: number) {
    return true;
  }

  async consume(queue: string, onMessage: Function, options?: any) {
    return { consumerTag: 'mock-consumer-tag' };
  }

  sendToQueue(queue: string, content: Buffer, options?: any): boolean {
    const messages = this.queues.get(queue) || [];
    messages.push({ content, options });
    this.queues.set(queue, messages);
    return true;
  }

  publish(exchange: string, routingKey: string, content: Buffer, options?: any): boolean {
    const exchangeData = this.exchanges.get(exchange);
    if (!exchangeData) return false;
    
    // Simular publicación exitosa
    return true;
  }

  async checkQueue(queue: string) {
    const messages = this.queues.get(queue) || [];
    return {
      queue,
      messageCount: messages.length,
      consumerCount: 0
    };
  }

  ack(message: any) {
    return true;
  }

  nack(message: any, allUpTo?: boolean, requeue?: boolean) {
    return true;
  }

  on(event: string, handler: Function) {
    // Mock event handlers
  }

  async close() {
    this.queues.clear();
    this.exchanges.clear();
  }

  // Métodos de ayuda para tests
  getMessages(queue: string) {
    return this.queues.get(queue) || [];
  }

  clearQueue(queue: string) {
    this.queues.set(queue, []);
  }

  clearAllQueues() {
    this.queues.clear();
  }
}

export class MockConnection {
  private channel: MockChannel | null = null;

  async createConfirmChannel() {
    this.channel = new MockChannel();
    return this.channel;
  }

  async createChannel() {
    this.channel = new MockChannel();
    return this.channel;
  }

  on(event: string, handler: Function) {
    // Mock event handlers
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
  }

  getChannel() {
    return this.channel;
  }
}

export const mockConnect = jest.fn(async () => {
  return new MockConnection();
});

// Mock del módulo amqplib
jest.mock('amqplib', () => ({
  connect: mockConnect,
}));

export { MockChannel as Channel, MockConnection as Connection };
