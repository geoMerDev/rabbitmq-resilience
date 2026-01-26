import { Channel, connect, Connection } from 'amqplib';
import { assertExchange, assertQueue } from './config';
import { RabbitMQMessageDto } from "@/domain/dtos/eventManager";
import { EventException } from "@/infrastructure/eventManager/eventException";
import { QueueStatus } from "@/domain/entities/eventManager/rabbitMQInfo.entity";
import { RabbitMQResilienceSocketManager } from "@/infrastructure/socket/rabbitMQResilienceSocketManager";
import signature from "@/infrastructure/socket/signatures";
import { EventStatus } from "@/infrastructure/eventManager/eventResilienceHandler";
import { RabbitMQResilienceConfig } from "@/domain/interfaces/rabbitMQResilienceConfig";
import { DeliveryInfo } from "@/domain/interfaces/outboxEvent";
import { InboxEventDatasourceImpl, OutboxEventDatasourceImpl } from "@/infrastructure/datasources/eventManager";
import { OutboxEventSequelize } from "@/infrastructure/database/models/eventManager/OutboxEvent";
import { Logs } from '@/infrastructure/utils/logs';
import { EmailConfigInterface } from '@/domain/interfaces/emailConfig';

/**
 * Class representing RabbitMQ operations.
 */
export class RabbitMQ {
    private static _connection: Connection
    private static _channel: Channel
    private static _isConsuming = false
    private static _consumerTag: string | null = null;
    private static _config: RabbitMQResilienceConfig
    private static _eventList: Map<string, (rabbitMQMessageDto: RabbitMQMessageDto) => Promise<void>>;
    private static _emailConfig: EmailConfigInterface;
    private static _isReconnecting = false;
    private static readonly MAX_RECONNECT_DELAY = 60000; // 60 segundos máximo

    public static set config(value: RabbitMQResilienceConfig) {
        this._config = value;
    }

    public static set eventList(value: Map<string, (rabbitMQMessageDto: RabbitMQMessageDto) => Promise<void>>) {
        this._eventList = value;
    }

    public static set emailConfig(value: EmailConfigInterface) {
        this._emailConfig = value;
    }


    /**
     * Establishes a connection to RabbitMQ and creates a confirm channel.
     */
    public static async connection() {
        try {
            this._connection = await connect(this._config.rabbitMQConfigConnect)
            this._channel = await this._connection.createConfirmChannel()
            this.handle()
        } catch (e: any) {
            const errorMsg = e?.code === 'ENOTFOUND'
                ? `No se pudo conectar a RabbitMQ en ${e.hostname}`
                : `Error al conectar a RabbitMQ: ${e?.message || 'Error desconocido'}`;
            Logs.error(`RabbitMQResilience: ${errorMsg}`);
            this.reconnect();
        }
    }

    private static handle() {
        this._connection.on('error', (err) => {
            Logs.error("RabbitMQResilience: Connection error:", err);
        });

        this._connection.on('close', () => {
            Logs.warn("RabbitMQResilience: Connection closed. Attempting to reconnect...");
            this.reconnect();
        });

        this._channel.on('error', (err) => {
            Logs.error("RabbitMQResilience: Channel error:", err);
        });

        this._channel.on('close', () => {
            Logs.warn("RabbitMQResilience: Channel closed. Closing connection to reconnect to rabbit...");
            this._connection.close();
        });
    }

    private static async reconnect(delay = 5000) {
        if (this._isReconnecting) {
            return; // Evitar múltiples reconexiones simultáneas
        }

        this._isConsuming = false;
        this._isReconnecting = true;

        setTimeout(async () => {
            try {
                await this.connection();

                if (this._channel && this._connection) {
                    Logs.info("RabbitMQResilience: Conexión establecida");
                    await this.consume();
                    await this.retryPendingOutboxEvents(); // Retry pending events after reconnection
                    Logs.info("RabbitMQResilience: Reconectado exitosamente");
                    this._isReconnecting = false;
                } else {
                    throw new Error("Connection or channel not available after reconnection.");
                }

            } catch (err: any) {
                // Limitar el delay máximo a 60 segundos
                const nextDelay = Math.min(delay * 2, this.MAX_RECONNECT_DELAY);
                Logs.error(`RabbitMQResilience: Reintentando en ${nextDelay / 1000}s...`);
                this._isReconnecting = false;
                this.reconnect(nextDelay);
            }
        }, delay);
    }

    /**
     * Sets up the main queue and binds it to the exchange with a routing key.
     */
    public static async setQueue() {
        if (this._channel) {
            await this._channel.assertQueue(
                this._config.queue,
                assertQueue
            )

            await this._channel.assertExchange(
                this._config.exchange,
                this._config.typeExchange,
                assertExchange
            )

            await this._channel.bindQueue(
                this._config.queue,
                this._config.exchange,
                this._config.routingKey
            )

            await this._channel.prefetch(this._config.prefetch)
            Logs.info(`RabbitMQResilience: Queue '${this._config.queue}' is set up and bound to exchange '${this._config.exchange}' with routing key '${this._config.routingKey}'`);
        } else {
            Logs.error("RabbitMQResilience: Channel not found");
        }
    }

    /**
     * Sets up the retry queue with a dead letter exchange and message TTL, and binds it to the direct exchange with a routing key.
     */
    public static async setRetryQueue() {
        if (this._channel) {
            await this._channel.assertExchange(
                this._config.directExchange,
                this._config.typeDirectExchange,
                assertExchange
            );

            await this._channel.assertQueue(
                this._config.retryQueue,
                {
                    ...assertQueue,
                    deadLetterExchange: this._config.exchange,
                    messageTtl: this._config.messageTTL
                }
            );

            await this._channel.bindQueue(
                this._config.retryQueue,
                this._config.directExchange,
                this._config.retryRoutingKey,
            );

            Logs.info(`RabbitMQResilience: Retry queue '${this._config.retryQueue}' is set up and bound to exchange '${this._config.directExchange}' with routing key '${this._config.retryRoutingKey}'`);
        } else {
            Logs.error("RabbitMQResilience: Channel not found");
        }
    }

    /**
     * Sets up the dead letter queue and binds it to the direct exchange with a routing key.
     */
    public static async setDeadLetterQueue() {
        if (this._channel) {
            await this._channel.assertExchange(
                this._config.directExchange,
                this._config.typeDirectExchange,
                assertExchange
            )

            await this._channel.assertQueue(
                this._config.deadLetterQueue,
                assertQueue
            )

            await this._channel.bindQueue(
                this._config.deadLetterQueue,
                this._config.directExchange,
                this._config.deadLetterRoutingKey
            )

            Logs.info(`RabbitMQResilience: Dead letter queue '${this._config.deadLetterQueue}' is set up and bound to exchange '${this._config.directExchange}' with routing key '${this._config.deadLetterRoutingKey}'`);
        } else {
            Logs.error("RabbitMQResilience: Channel not found");
        }
    }

    /**
     * Consumes messages from the main queue and processes them.
     */
    public static async consume() {
        if (!this._channel) {
            Logs.error("RabbitMQResilience: Channel not found");;
            return;
        }
        if (this._isConsuming) {
            Logs.info("RabbitMQResilience: Already consuming. Skipping...");
            return;
        }
        const { consumerTag } = await this._channel.consume(
            this._config.queue,
            (msg) => {
                if (!msg) return;

                // FAST PATH: Extract type directly from raw message
                const eventType = msg.properties.type;

                // Check if processor exists BEFORE creating expensive DTO
                if (!this._eventList.has(eventType)) {
                    // Immediate discard - synchronous, no DTO creation
                    try {
                        this._channel.ack(msg);
                    } catch (error) {
                        Logs.error(`RabbitMQResilience: Error acknowledging discarded message: ${error}`);
                    }
                    return;
                }

                // SLOW PATH: Only create DTO for valid events
                (async () => {
                    const [error, eventDto] = RabbitMQMessageDto.create(msg);

                    try {
                        if (error.length > 0 || !eventDto) {
                            // Publish to dead letter queue
                            Logs.error(`RabbitMQResilience: Error creating RabbitMQMessageDto: ${error.join(', ')}`);
                            await this.sendToDeadLetterQueueOnError(msg, error);
                            return;
                        }

                        const headers = eventDto.properties.headers;
                        if (headers?.redelivery_count && headers.retry_endpoint !== this._config.retryEndpoint) {
                            Logs.warn(`RabbitMQResilience: Message ${eventDto.properties.messageId} has redelivery_count and retry_endpoint is different (${headers.retry_endpoint} vs ${this._config.retryEndpoint}). Sending to DLQ.`);
                            await this.publishToDeadLetterQueue(eventDto, null);
                            return;
                        }

                        Logs.time(`${eventType}-${eventDto.properties.messageId}`);
                        await this.messageHandler(eventDto);
                        Logs.timeEnd(`${eventType}-${eventDto.properties.messageId}`);
                    } catch (error) {
                        Logs.error(error as string);
                    } finally {
                        this._channel.ack(msg);
                    }
                })();
            }
        )
        this._consumerTag = consumerTag;
        this._isConsuming = true;
        Logs.info(`RabbitMQResilience: Started consuming with tag ${this._consumerTag}\n`);
    }

    /**
     * Handles the processing of a message by invoking the appropriate event processors.
     * @param {RabbitMQMessageDto} msg - The message to be processed.
     */
    private static async messageHandler(msg: RabbitMQMessageDto) {
        const eventProcessor = this._eventList.get(msg.properties.type);

        if (eventProcessor) {
            await eventProcessor(msg);
        } else {
            // Event not found - silently discard
            if (RabbitMQResilienceSocketManager.getSocket()) {
                RabbitMQResilienceSocketManager.emit(signature.DISCARD_MESSAGE.abbr,
                    {
                        message: `Event ${msg.properties.messageId} - ${EventStatus.DISCARD_MESSAGE}`,
                        eventUuid: msg.properties.messageId,
                        status: EventStatus.DISCARD_MESSAGE,
                        type: msg.properties.type,
                    }
                );
            }
        }
    }

    /**
     * Publishes an event to the retry queue with a redelivery count.
     * @param {RabbitMQMessageDto} event - The event to be published.
     * @param {number} redeliveryCount - The redelivery count for the event.
     */
    public static async publishToRetryQueue(event: RabbitMQMessageDto, redeliveryCount: number) {
        if (this._channel) {
            event.properties.headers = {
                ...event.properties.headers,
                redelivery_count: redeliveryCount,
                retry_endpoint: this._config.retryEndpoint
            };
            //add properties to the event

            this._channel.sendToQueue(
                this._config.retryQueue,
                event.content,
                {
                    headers: event.properties.headers,
                    appId: event.properties.appId,
                    messageId: event.properties.messageId,
                    type: event.properties.type,
                    contentType: event.properties.contentType,
                    persistent: true,
                    expiration: (redeliveryCount * 2000).toString()

                }
            );
            Logs.info(`RabbitMQResilience: Published event ${event.properties.messageId} to retry queue with redelivery count ${redeliveryCount}\n`);
        } else {
            Logs.error("RabbitMQResilience: Channel not found");
        }
    }

    /**
     * Publishes an event to the dead letter queue with error details.
     * @param {RabbitMQMessageDto} event - The event to be published.
     * @param {EventException | null} error - The error details, if any.
     */
    public static async publishToDeadLetterQueue(event: RabbitMQMessageDto, error: EventException[] | null) {
        if (this._channel) {
            event.properties.headers = {
                exception_details: error ? error.map(err => err.exceptionDetail) : 'No error details',
                endpoint: {
                    name: this._config.retryEndpoint,
                    delivery_metadata: {
                        message_type: event.properties.type,
                        exchange: event.fields.exchange,
                        routing_key: event.fields.routingKey,
                    }
                }

            };
            this._channel.sendToQueue(
                this._config.deadLetterQueue,
                event.content,
                {
                    headers: event.properties.headers,
                    appId: event.properties.appId,
                    messageId: event.properties.messageId,
                    type: event.properties.type,
                    contentType: event.properties.contentType,
                    persistent: true
                }
            );
            Logs.info(`RabbitMQResilience: Published event ${event.properties.messageId} to dead letter queue\n`);
        } else {
            Logs.error("RabbitMQResilience: Channel not found");
        }
    }

    private static async sendToDeadLetterQueueOnError(msg: any, error: string[]) {
        if (this._channel) {
            const event = {
                content: msg.content,
                fields: msg.fields,
                properties: {
                    ...msg.properties,
                    headers: {
                        exception_details: error,
                        endpoint: {
                            name: this._config.retryEndpoint,
                            delivery_metadata: {
                                message_type: msg.properties.type,
                                exchange: msg.fields.exchange,
                                routing_key: msg.fields.routingKey,
                            }
                        }
                    }
                }
            };

            this._channel.sendToQueue(
                this._config.deadLetterQueue,
                event.content,
                {
                    headers: event.properties.headers,
                    persistent: true
                }
            );
            Logs.info(`RabbitMQResilience: Published event to dead letter queue due to error: ${error.join(', ')}\n`);
        } else {
            Logs.error("RabbitMQResilience: Channel not found");
        }
    }

    public static isConnected(): boolean {
        return !!this._connection;
    }

    private static async getQueueStatus(queueName: string): Promise<QueueStatus> {
        if (this._channel) {
            const queue = await this._channel.checkQueue(queueName);
            return {
                queue: queue.queue,
                messageCount: queue.messageCount,
                consumerCount: queue.consumerCount
            };
        } else {
            return {
                queue: 'error',
                messageCount: 0,
                consumerCount: 0
            };
        }
    }

    public static mainQueue(): string {
        return this._config.queue;
    }

    public static async mainQueueStatus(): Promise<QueueStatus> {
        return this.getQueueStatus(this._config.queue);
    }

    public static async retryQueueStatus(): Promise<QueueStatus> {
        return await this.getQueueStatus(this._config.retryQueue);
    }

    public static async deadLetterQueueStatus(): Promise<QueueStatus> {
        return await this.getQueueStatus(this._config.deadLetterQueue);
    }


    public static getHost(): string {
        return this._config.rabbitMQConfigConnect.hostname ?? "Unknown host";
    }

    public static getVirtualHost(): string {
        return this._config.rabbitMQConfigConnect.vhost ?? "Unknown virtual host";
    }

    public static getPrefetch(): number {
        return this._config.prefetch;
    }

    /**
     * Initializes the RabbitMQ setup by establishing a connection, setting up queues, and starting message consumption.
     */
    public static async init() {
        await this.connection()
        await this.setQueue()
        await this.setRetryQueue()
        await this.setDeadLetterQueue()
        await this.consume()
        await this.retryPendingOutboxEvents() // Retry pending events on startup
    }

    public static async publishMessage(event: RabbitMQMessageDto, exchange?: string, routingKey?: string): Promise<void> {
        // STEP 1: ALWAYS save to outbox first
        await new OutboxEventDatasourceImpl().registerFromRabbitMQMessageDto(event, null);

        // STEP 2: Try to publish if channel exists
        if (this._channel) {
            await this.tryPublishToExchange(event, exchange, routingKey);
        } else {
            Logs.warn(`RabbitMQResilience: No channel available, event ${event.properties.messageId} saved in outbox for retry`);
        }
    }

    private static async tryPublishToExchange(event: RabbitMQMessageDto, exchange?: string, routingKey?: string): Promise<void> {
        try {
            const targetExchange = exchange || this._config.exchange;
            const targetRoutingKey = routingKey || this._config.routingKey;

            const result = this._channel.publish(
                targetExchange,
                targetRoutingKey,
                event.content,
                {
                    headers: event.properties.headers,
                    appId: event.properties.appId,
                    messageId: event.properties.messageId,
                    type: event.properties.type,
                    contentType: event.properties.contentType,
                    persistent: true
                }
            );

            if (result) {
                await this.updateOutboxWithDeliveryInfo(event, 'exchange', targetExchange, targetRoutingKey);
                Logs.info(`RabbitMQResilience: Published event ${event.properties.messageId} to exchange ${targetExchange}`);
            } else {
                Logs.warn(`RabbitMQResilience: Failed to publish event ${event.properties.messageId}, will remain pending`);
            }
        } catch (error: any) {
            Logs.error(`RabbitMQResilience: Error publishing event ${event.properties.messageId}: ${error?.message || 'Unknown error'}`);
        }
    }

    private static async updateOutboxWithDeliveryInfo(
        event: RabbitMQMessageDto,
        destinationType: 'exchange' | 'queue',
        destinationName: string,
        routingKey?: string
    ): Promise<void> {
        const deliveryInfo: DeliveryInfo = {
            timestamp: new Date(),
            host: this.getHost(),
            virtualHost: this.getVirtualHost(),
            destinationType,
            destinationName,
            ...(routingKey && { routingKey })
        };

        await new OutboxEventDatasourceImpl().updateDeliveryInfo(event.properties.messageId, deliveryInfo);
    }

    public static async publishToQueueWithConfirmation(queue: string, event: RabbitMQMessageDto) {
        if (this._channel) {
            const result = this._channel.sendToQueue(
                queue,
                event.content,
                {
                    headers: event.properties.headers,
                    appId: event.properties.appId,
                    messageId: event.properties.messageId,
                    type: event.properties.type,
                    contentType: event.properties.contentType,
                    persistent: true
                }
            );

            const deliveryInfo: DeliveryInfo | null = result ? {
                timestamp: new Date(),
                host: this.getHost(),
                virtualHost: this.getVirtualHost(),
                destinationType: 'queue',
                destinationName: queue
            } : null;

            await new OutboxEventDatasourceImpl().registerFromRabbitMQMessageDto(event, deliveryInfo);

            if (result) {
                Logs.info(`RabbitMQResilience: Published event ${event.properties.messageId} to queue ${queue}`);
            } else {
                Logs.error(`Failed to publish event ${event.properties.messageId} to queue ${queue}`);
            }
        } else {
            Logs.error("RabbitMQResilience: Channel not found");
        }
    }

    public static async publishToExchangeWithConfirmation(event: RabbitMQMessageDto, exchange: string, routingKey: string) {
        if (this._channel) {
            const result = this._channel.publish(
                exchange,
                routingKey,
                event.content,
                {
                    headers: event.properties.headers,
                    appId: event.properties.appId,
                    messageId: event.properties.messageId,
                    type: event.properties.type,
                    contentType: event.properties.contentType,
                    persistent: true
                }
            );

            const deliveryInfo: DeliveryInfo | null = result ? {
                timestamp: new Date(),
                host: this.getHost(),
                virtualHost: this.getVirtualHost(),
                destinationType: 'exchange',
                destinationName: exchange,
                routingKey: routingKey
            } : null;

            await new OutboxEventDatasourceImpl().registerFromRabbitMQMessageDto(event, deliveryInfo);

            if (result) {
                Logs.info(`RabbitMQResilience: Published event ${event.properties.messageId} to exchange ${exchange}`);
            } else {
                Logs.error(`RabbitMQResilience: Failed to publish event ${event.properties.messageId} to exchange ${exchange}`);
            }
        } else {
            Logs.error("RabbitMQResilience: Channel not found");
        }
    }

    public static async retryPublishOutboxEventByUuid(uuid: string) {
        const outboxEvent = await new OutboxEventDatasourceImpl().getByUuid(uuid);
        if (!outboxEvent) {
            console.error(`Event ${uuid} not found in outbox`);
            return;
        }

        const [error, eventDto] = RabbitMQMessageDto.create({
            content: Buffer.from(JSON.stringify(outboxEvent.payload)),
            fields: {
                delivery_tag: 0,
                redelivered: false,
                exchange: this._config.exchange,
                routing_key: this._config.routingKey
            },
            properties: outboxEvent.properties,
        });

        if (error.length > 0 || !eventDto) {
            console.error(`Failed to create RabbitMQMessageDto: ${error.join(', ')}`);
            return;
        }

        // Assuming you want to publish the event again
        await this.publishMessage(eventDto);
    }

    /**
     * Reprocesses an event from the inbox without resilience.
     * @param {string} uuid - The UUID of the event to reprocess.
     * @param {string} processName - The name of the process to reprocess.
     */
    public static async reprocessFromInboxEvent(uuid: string, processName: string) {
        // Get event from inbox
        const inboxEvent = await new InboxEventDatasourceImpl().getByUuid(uuid);
        if (!inboxEvent) {
            Logs.error(`Event ${uuid} not found in inbox`);
            return;
        }
        // Transform inbox event to RabbitMQMessageDto
        const [error, eventDto] = RabbitMQMessageDto.create({
            content: Buffer.from(JSON.stringify(inboxEvent.payload)),
            fields: {
                delivery_tag: 0,
                redelivered: false,
                exchange: this._config.exchange,
                routing_key: this._config.routingKey
            },
            properties: inboxEvent.properties,
        });
        if (error.length > 0 || !eventDto) {
            Logs.error(`Failed to create RabbitMQMessageDto: ${error.join(', ')}`);
            return;
        }

        // Reprocess specific process for the event from inbox without resilience
        const eventConfig = this._config.eventsToProcess.find(config => config.eventType === inboxEvent.type);

        if (eventConfig) {
            const process = eventConfig.processes.find(proc => proc.processName === processName);
            if (process) {
                try {
                    await process.processFunction(eventDto);
                } catch (error) {
                    Logs.error(`Error processing event ${uuid} with process ${process.processName}:`, error);
                }
            } else {
                Logs.error(`No process found with name ${processName} for event type ${inboxEvent.type}`);
            }
        } else {
            Logs.error(`No processes found for event type ${inboxEvent.type}`);
        }
    }

    public static getIsConsuming() {
        return this._isConsuming;
    }

    /**
     * Retries all pending outbox events (events with deliveryInfo = null)
     * This function is called on startup and after reconnection to publish events that accumulated while disconnected
     * Processes events in batches to avoid memory overload
     * @param {number} batchSize - Number of events to process per batch (default: 100)
     */
    public static async retryPendingOutboxEvents(batchSize: number = 100): Promise<void> {
        if (!this._channel) {
            Logs.warn('RabbitMQResilience: Cannot retry pending events, no channel available');
            return;
        }

        try {
            let totalProcessed = 0;
            let hasMore = true;

            while (hasMore) {
                // Get pending events from outbox
                const pendingEvents = await OutboxEventSequelize.findAll({
                    where: {
                        deliveryInfo: null
                    },
                    limit: batchSize,
                    order: [['createdAt', 'ASC']] // Oldest first
                });

                if (pendingEvents.length === 0) {
                    hasMore = false;
                    break;
                }

                Logs.info(`RabbitMQResilience: Processing batch of ${pendingEvents.length} pending outbox events`);

                for (const event of pendingEvents) {
                    const [error, eventDto] = RabbitMQMessageDto.create({
                        content: Buffer.from(JSON.stringify(event.payload)),
                        fields: {
                            delivery_tag: 0,
                            redelivered: false,
                            exchange: this._config.exchange,
                            routing_key: this._config.routingKey
                        },
                        properties: event.properties,
                    });

                    if (error.length > 0 || !eventDto) {
                        Logs.error(`RabbitMQResilience: Failed to create RabbitMQMessageDto for ${event.uuid}: ${error.join(', ')}`);
                        continue;
                    }

                    // Use tryPublishToExchange instead of publishMessage to avoid double-saving to outbox
                    await this.tryPublishToExchange(eventDto);
                }

                totalProcessed += pendingEvents.length;

                // If we got fewer events than the batch size, there are no more pending events
                if (pendingEvents.length < batchSize) {
                    hasMore = false;
                }
            }

            if (totalProcessed === 0) {
                Logs.info('RabbitMQResilience: No pending outbox events to retry');
            } else {
                Logs.info(`RabbitMQResilience: Finished retrying ${totalProcessed} pending outbox events`);
            }
        } catch (error: any) {
            Logs.error(`RabbitMQResilience: Error retrying pending outbox events: ${error?.message || 'Unknown error'}`);
        }
    }
}
