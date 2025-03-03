import {Options} from "amqplib"


/**
 * Configuration object for asserting a queue in RabbitMQ.
 * @type {Options.AssertQueue}
 */
export const assertQueue: Options.AssertQueue = {
    durable: true
}

/**
 * Configuration object for asserting an exchange in RabbitMQ.
 * @type {Options.AssertExchange}
 */
export const assertExchange: Options.AssertExchange = {
    durable: true
}
