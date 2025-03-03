import {RabbitMQMessageDto} from "@/domain/dtos/eventManager";
import {RabbitMQResilienceConfig} from "@/domain/interfaces/rabbitMQResilienceConfig";
import {createEventList} from "@/infrastructure/eventManager/createEventList";
import {RabbitMQ} from "@/infrastructure/eventManager/rabbitmq";
import {DbSequelize} from "@/infrastructure/database/init";

/**
 * Class responsible for managing RabbitMQ resilience.
 */
export class RabbitMQResilience {
    private static instance: RabbitMQResilience;
    private readonly config: RabbitMQResilienceConfig;
    private readonly eventList: Map<string, (rabbitMQMessageDto: RabbitMQMessageDto) => Promise<void>>;

    /**
     * Private constructor to enforce singleton pattern.
     * @param {RabbitMQResilienceConfig} config - Configuration for RabbitMQ resilience.
     */
    private constructor(config: RabbitMQResilienceConfig) {
        this.config = config;
        this.eventList = createEventList(config);
    }

    /**
     * Initializes the RabbitMQResilience singleton instance.
     * @param {RabbitMQResilienceConfig} config - Configuration for RabbitMQ resilience.
     * @returns {RabbitMQResilience} The singleton instance.
     */
    public static initialize(config: RabbitMQResilienceConfig): RabbitMQResilience {
        if (!RabbitMQResilience.instance) {
            RabbitMQResilience.instance = new RabbitMQResilience(config);
        }
        return RabbitMQResilience.instance;
    }

    /**
     * Gets the singleton instance of RabbitMQResilience.
     * @returns {RabbitMQResilience} The singleton instance.
     * @throws {Error} If the instance is not initialized.
     */
    public static getInstance(): RabbitMQResilience {
        if (!RabbitMQResilience.instance) {
            throw new Error('RabbitMQResilience not initialized');
        }
        return RabbitMQResilience.instance;
    }

    /**
     * Initializes RabbitMQ connection and sets up queues.
     */
    public async init() {
        // Sync tables
        await this.syncTables();

        RabbitMQ.config = this.config;
        RabbitMQ.eventList = this.eventList;
        await RabbitMQ.connection();
        //only set queues and star consumer if exists event to process
        if (this.eventList.size > 0) {
            await RabbitMQ.setQueue();
            await RabbitMQ.setRetryQueue();
            await RabbitMQ.setDeadLetterQueue();
            await RabbitMQ.consume();
        }

    }

    /**
     * Synchronizes database tables.
     * @private
     */
    private async syncTables() {
        DbSequelize(this.config.sequelizeConnection).then(
            () => console.log('Tables synced')
        ).catch(
            (e) => console.log(e)
        );
    }

    /**
     * Publishes an event to the default exchange.
     * @param {RabbitMQMessageDto} event - The event to publish.
     */
    public async pubishEvent(event: RabbitMQMessageDto) {
        await RabbitMQ.publishMessage(event);
    }

    /**
     * Publishes an event to a custom exchange with a routing key.
     * @param {RabbitMQMessageDto} event - The event to publish.
     * @param {string} exchange - The exchange to publish to.
     * @param {string} routingKey - The routing key to use.
     */
    public async pubishEventCustomExchange(event: RabbitMQMessageDto, exchange: string, routingKey: string) {
        await RabbitMQ.publishMessage(event, exchange, routingKey);
    }

    /**
     * Publishes an event to a specific queue with confirmation.
     * @param {string} queue - The queue to publish to.
     * @param {RabbitMQMessageDto} event - The event to publish.
     */
    public async publishToQueue(queue: string, event: RabbitMQMessageDto) {
        await RabbitMQ.publishToQueueWithConfirmation(queue, event);
    }

    /**
     * re publish event from outbox event to default exchange
     * @param {string} uuid - The uuid of the event to republish.
     */
    public async republishEvent(uuid: string) {
        await RabbitMQ.retryPublishOutboxEventByUuid(uuid);
    }

    /**
     * reprocess event from inbox event by uuid and process name
     */
    public async reprocessEvent(uuid: string, processName: string) {
        await RabbitMQ.reprocessFromInboxEvent(uuid, processName);
    }
}