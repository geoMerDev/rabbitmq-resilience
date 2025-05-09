import {Channel, connect, Connection} from 'amqplib';
import {assertExchange, assertQueue} from './config';
import {RabbitMQMessageDto} from "@/domain/dtos/eventManager";
import {EventException} from "@/infrastructure/eventManager/eventException";
import {QueueStatus} from "@/domain/entities/eventManager/rabbitMQInfo.entity";
import {RabbitMQResilienceSocketManager} from "@/infrastructure/socket/rabbitMQResilienceSocketManager";
import signature from "@/infrastructure/socket/signatures";
import {EventStatus} from "@/infrastructure/eventManager/eventResilienceHandler";
import {RabbitMQResilienceConfig} from "@/domain/interfaces/rabbitMQResilienceConfig";
import {DeliveryInfo} from "@/domain/interfaces/outboxEvent";
import {InboxEventDatasourceImpl, OutboxEventDatasourceImpl} from "@/infrastructure/datasources/eventManager";

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

    public static set config(value: RabbitMQResilienceConfig) {
        this._config = value;
    }

    public static set eventList(value: Map<string, (rabbitMQMessageDto: RabbitMQMessageDto) => Promise<void>>) {
        this._eventList = value;
    }


    /**
     * Establishes a connection to RabbitMQ and creates a confirm channel.
     */
    public static async connection() {
        try {
            this._connection = await connect(this._config.rabbitMQConfigConnect)
            this._channel = await this._connection.createConfirmChannel()
            this.handle()
        } catch (e) {
            console.log("RabbitMQResilience: ",e)
            this.reconnect();
        }
    }

    private static handle() {
        this._connection.on('error', (err) => {
            console.error("RabbitMQResilience: Connection error:", err);
        });

        this._connection.on('close', () => {
            console.warn("RabbitMQResilience: Connection closed. Attempting to reconnect...");
            this.reconnect();
        });

        this._channel.on('error', (err) => {
            console.error("RabbitMQResilience: Channel error:", err);
        });

        this._channel.on('close', () => {
            console.warn("RabbitMQResilience: Channel closed. Closing connection to reconnect to rabbit...");
            this._connection.close();
        });
    }
    
    private static async reconnect(delay = 5000) {
        this._isConsuming = false;
        
        setTimeout(async () => {
            try {
                await this.connection();
    
                if (this._channel && this._connection) {
                    console.log("RabbitMQResilience: Connection established. Trying to consume...");
                    await this.consume();
                    console.log("RabbitMQResilience: Reconnected successfully.");
                } else {
                    throw new Error("Connection or channel not available after reconnection.");
                }
    
            } catch (err) {
                console.error("RabbitMQResilience: Reconnection failed:", err);
                this.reconnect(delay * 2);
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
            console.log(`RabbitMQResilience: Queue '${this._config.queue}' is set up and bound to exchange '${this._config.exchange}' with routing key '${this._config.routingKey}'`);
        } else {
            console.log("RabbitMQResilience: Channel not found")
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

            console.log(`RabbitMQResilience: Retry queue '${this._config.retryQueue}' is set up and bound to exchange '${this._config.directExchange}' with routing key '${this._config.retryRoutingKey}'`);
        } else {
            console.log("RabbitMQResilience: Channel not found");
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

           console.log(`RabbitMQResilience: Dead letter queue '${this._config.deadLetterQueue}' is set up and bound to exchange '${this._config.directExchange}' with routing key '${this._config.deadLetterRoutingKey}'`);
        } else {
            console.log("RabbitMQResilience: Channel not found")
        }
    }

    /**
     * Consumes messages from the main queue and processes them.
     */
    public static async consume() {
        if (!this._channel) {
            console.log("RabbitMQResilience: Channel not found");
            return;
        }
        if (this._isConsuming) {
            console.log("RabbitMQResilience: Already consuming. Skipping...");
            return;
        }
        const { consumerTag } = await this._channel.consume(
            this._config.queue,
            (msg) => {
                (async () => {
                    try {
                        const [error, eventDto] = RabbitMQMessageDto.create(msg!);

                        if (error.length > 0 || !eventDto) {
                            // Publish to dead letter queue
                            await this.sendToDeadLetterQueueOnError(msg!, error);
                            this._channel.ack(msg!);
                            return;
                        } else {
                            const headers = eventDto.properties.headers;
                            if (headers?.redelivery_count && headers.retry_endpoint !== this._config.retryEndpoint) {
                                console.log(`RabbitMQResilience: Message ${eventDto.properties.messageId} has redelivery_count and retry_endpoint is different. Acknowledging without processing.`);
                                this._channel.ack(msg!);
                                return;
                            }
                            await this.messageHandler(eventDto);
                        }
                    } catch (error) {
                        console.log("RabbitMQResilience: ",error);
                    }
                    this._channel.ack(msg!);
                })();
            }
        )
        this._consumerTag = consumerTag;
        this._isConsuming = true;
        console.log(`RabbitMQResilience: Started consuming with tag ${this._consumerTag}`);
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
            console.log("RabbitMQResilience: Event not found:" + msg.properties.type);
            RabbitMQResilienceSocketManager.emit(signature.DISCARD_MESSAGE.abbr,
                {
                    message: `Event ${msg.properties.messageId} - ${EventStatus.DISCARD_MESSAGE}`,
                    eventUuid: msg.properties.messageId,
                    status: EventStatus.DISCARD_MESSAGE,
                    type: msg.properties.type,
                });
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
            console.log(`RabbitMQResilience: Published event ${event.properties.messageId} to retry queue with redelivery count ${redeliveryCount}`);
        } else {
            console.log("RabbitMQResilience: Channel not found");
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
            console.log(`RabbitMQResilience: Published event ${event.properties.messageId} to dead letter queue`);
        } else {
            console.log("RabbitMQResilience: Channel not found");
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
            console.log(`RabbitMQResilience: Published event to dead letter queue due to error: ${error.join(', ')}`);
        } else {
            console.log("RabbitMQResilience: Channel not found");
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
        //await this.fakeConsume()
    }

    public static async publishMessage(event: RabbitMQMessageDto, exchange?: string, routingKey?: string): Promise<void> {
        if (this._channel) {
            if (exchange && routingKey) {
                await this.publishToExchangeWithConfirmation(event, exchange, routingKey);
            } else {
                const defaultExchange = this._config.exchange;
                const defaultRoutingKey = this._config.routingKey;
                await this.publishToExchangeWithConfirmation(event, defaultExchange, defaultRoutingKey);
            }
        } else {
            console.log("RabbitMQResilience: Channel not found");
        }
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
                console.log(`RabbitMQResilience: Published event ${event.properties.messageId} to queue ${queue}`);
            } else {
                console.error(`Failed to publish event ${event.properties.messageId} to queue ${queue}`);
            }
        } else {
            console.log("RabbitMQResilience: Channel not found");
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
                console.log(`RabbitMQResilience: Published event ${event.properties.messageId} to exchange ${exchange}`);
            } else {
                console.error(`RabbitMQResilience: Failed to publish event ${event.properties.messageId} to exchange ${exchange}`);
            }
        } else {
            console.log("RabbitMQResilience: Channel not found");
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
            console.error(`Event ${uuid} not found in inbox`);
            return;
        }
        // Transform inbox event to RabbitMQMessageDto
        const [error, eventDto] = RabbitMQMessageDto.create({
            content: Buffer.from(JSON.stringify(inboxEvent.payload)),
            properties: inboxEvent.properties,
        });
        if (error.length > 0 || !eventDto) {
            console.error(`Failed to create RabbitMQMessageDto: ${error.join(', ')}`);
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
                    console.error(`Error processing event ${uuid} with process ${process.processName}:`, error);
                }
            } else {
                console.error(`No process found with name ${processName} for event type ${inboxEvent.type}`);
            }
        } else {
            console.error(`No processes found for event type ${inboxEvent.type}`);
        }
    }

    public static getIsConsuming() {
        return this._isConsuming;
    }
}
