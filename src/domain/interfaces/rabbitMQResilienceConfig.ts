import {Sequelize, Options as SequelizeOptions} from "sequelize";
import {Options} from "amqplib";
import {EventResilienceHandlerConfig} from "@/domain/interfaces/eventResilienceHandlerConfig";
import {EventProcessConfig} from "@/domain/interfaces/eventProcessConfig";

/**
 * Interface representing the configuration for RabbitMQ resilience.
 */
export interface RabbitMQResilienceConfig {
    /**
     * Configuration options for connecting to RabbitMQ.
     */
    rabbitMQConfigConnect: Options.Connect;

    /**
     * The name of the queue.
     */
    queue: string;

    /**
     * The routing key for the queue.
     */
    routingKey: string;

    /**
     * The name of the exchange.
     */
    exchange: string;

    /**
     * The type of the exchange.
     */
    typeExchange: string;

    /**
     * The number of messages to prefetch.
     */
    prefetch: number;

    /**
     * The name of the direct exchange.
     */
    directExchange: string;

    /**
     * The type of the direct exchange.
     */
    typeDirectExchange: string;

    /**
     * The name of the retry queue.
     */
    retryQueue: string;

    /**
     * The routing key for the retry queue.
     */
    retryRoutingKey: string;

    /**
     * The endpoint for retrying messages.
     */
    retryEndpoint: string;

    /**
     * The name of the dead letter queue.
     */
    deadLetterQueue: string;

    /**
     * The routing key for the dead letter queue.
     */
    deadLetterRoutingKey: string;

    /**
     * The time-to-live for messages in milliseconds.
     */
    messageTTL: number;

    /**
     * Configuration for the event resilience handler.
     */
    eventResilienceHandlerConfig: EventResilienceHandlerConfig;

    /**
     * An array of configurations for processing events.
     */
    eventsToProcess: EventProcessConfig[];

    /**
     * The Sequelize connection instance.
     */
    sequelizeConnection: Sequelize | null;

    /**
     * The Sequelize connection options.
     */
    sequelizeOptions?: SequelizeOptions;

    /**
     * Whether to show logs for the RabbitMQ resilience operations.
     */
    showLogs?: ShowLogs;
}

export interface ShowLogs {
    log?:boolean,
    error?:boolean,
    warn?:boolean,
    info?:boolean,
    debug?:boolean,
    trace?:boolean,
    time?:boolean,
    timeEnd?:boolean,
}