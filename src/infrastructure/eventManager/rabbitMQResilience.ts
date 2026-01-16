import { RabbitMQMessageDto } from "@/domain/dtos/eventManager";
import { RabbitMQResilienceConfig } from "@/domain/interfaces/rabbitMQResilienceConfig";
import { createEventList } from "@/infrastructure/eventManager/createEventList";
import { RabbitMQ } from "@/infrastructure/eventManager/rabbitmq";
import { DbSequelize, sequelize } from "@/infrastructure/database/init";
import { Logs } from '@/infrastructure/utils/logs';
import { EmailConfigInterface } from "@/domain/interfaces/emailConfig";
import DatabaseHook from "../database/hook";
import { EmailConfig } from "../email/email";

/**
 * Class responsible for managing RabbitMQ resilience.
 */
export class RabbitMQResilience {
    private static instance: RabbitMQResilience;
    private readonly config: RabbitMQResilienceConfig;
    private readonly emailConfig: EmailConfigInterface;
    private readonly eventList: Map<string, (rabbitMQMessageDto: RabbitMQMessageDto) => Promise<void>>;

    /**
     * Private constructor to enforce singleton pattern.
     * @param {RabbitMQResilienceConfig} config - Configuration for RabbitMQ resilience.
     */
    private constructor(config: RabbitMQResilienceConfig) {
        this.config = config;
        this.eventList = createEventList(config);
        this.emailConfig = config.emailConfig;
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
        try {
            // Sync tables (CRÍTICO - debe fallar si no conecta)
            DatabaseHook.config = this.config.rotationTables;
            await this.syncTables(); // Si falla aquí, se detiene todo

            RabbitMQ.config = this.config;
            RabbitMQ.eventList = this.eventList;
            RabbitMQ.emailConfig = this.emailConfig;
            Logs.config = this.config.showLogs ? { ...Logs.setDefaultConfig(), ...this.config.showLogs } : Logs.setDefaultConfig();
            EmailConfig.config = this.emailConfig;
            EmailConfig.initialize();
            await RabbitMQ.connection();

            if (this.eventList.size > 0) {
                await RabbitMQ.setQueue();
                await RabbitMQ.setRetryQueue();
                await RabbitMQ.setDeadLetterQueue();
                await RabbitMQ.consume();
            }
            
            // Republicar eventos pendientes con attempts = 0
            await RabbitMQ.republishPendingEvents();
        } catch (error) {
            Logs.error("RabbitMQResilience: Initialization failed:", error);
            throw error; // Re-lanzar para que el llamador lo maneje
        }
    }

    public isConsuming() {
        return RabbitMQ.getIsConsuming()
    }

    /**
     * Synchronizes database tables.
     * @private
     */
    private async syncTables() {
        if (!this.config.sequelizeConnection && !this.config.sequelizeOptions) {
            throw new Error("RabbitMQResilience: Invalid Instance or sequelize connection options");
        }

        try {
            //@ts-ignore
            const instance = this.config.sequelizeConnection ?? sequelize(this.config.sequelizeOptions);

            // Usar await en lugar de .then().catch()
            await DbSequelize(instance);

            Logs.info('RabbitMQResilience: Database tables synchronized successfully');
        } catch (error) {
            Logs.error("RabbitMQResilience: Failed to connect to database:", error);
            // RE-LANZAR el error para que init() lo capture
            throw new Error(`RabbitMQResilience: Database connection failed - ${error}`);
        }
    }

    /**
     * Publishes an event to the default exchange.
     * @param {RabbitMQMessageDto} event - The event to publish.
     */
    public async publishEvent(event: RabbitMQMessageDto) {
        await RabbitMQ.publishMessage(event);
    }

    /**
     * Publishes an event to a custom exchange with a routing key.
     * @param {RabbitMQMessageDto} event - The event to publish.
     * @param {string} exchange - The exchange to publish to.
     * @param {string} routingKey - The routing key to use.
     */
    public async publishEventCustomExchange(event: RabbitMQMessageDto, exchange: string, routingKey: string) {
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