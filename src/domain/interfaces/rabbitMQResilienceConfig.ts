import {Sequelize, Options as SequelizeOptions} from "sequelize";
import {Options} from "amqplib";
import {EventResilienceHandlerConfig} from "@/domain/interfaces/eventResilienceHandlerConfig";
import {EventProcessConfig} from "@/domain/interfaces/eventProcessConfig";
import { SlackConfig } from "./slackConfig";
import type { ConnectOptions } from 'ssh2-sftp-client'

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

    /**
     * Configuration for Slack notifications.
     */
    slackConfig: SlackConfig;

    /**
     * Rotations tables
     */
    rotationTables: RotationTables;
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

export interface RotationTables {
    enable: boolean;
    maxRecords: number;
    sftpServer?: SftpConnectOptions;
}


export interface SftpConnectOptions {
    /** Hostname or IP address of the server. */
    host?: string;
    /** Port number of the server. */
    port?: number;
    /** Only connect via resolved IPv4 address for `host`. */
    forceIPv4?: boolean;
    /** Only connect via resolved IPv6 address for `host`. */
    forceIPv6?: boolean;
    /** The host's key is hashed using this method and passed to `hostVerifier`. */
    hostHash?: string;
    /** Username for authentication. */
    username?: string;
    /** Password for password-based user authentication. */
    password?: string;
    /** Path to ssh-agent's UNIX socket for ssh-agent-based user authentication (or 'pageant' when using Pagent on Windows). */
    agent?: string;
    /** Buffer or string that contains a private key for either key-based or hostbased user authentication (OpenSSH format). */
    privateKey?: Buffer | string;
    /** For an encrypted private key, this is the passphrase used to decrypt it. */
    passphrase?: Buffer | string;
    /** Along with `localUsername` and `privateKey`, set this to a non-empty string for hostbased user authentication. */
    localHostname?: string;
    /** Along with `localHostname` and `privateKey`, set this to a non-empty string for hostbased user authentication. */
    localUsername?: string;
    /** Try keyboard-interactive user authentication if primary user authentication method fails. */
    tryKeyboard?: boolean;
    /** How often (in milliseconds) to send SSH-level keepalive packets to the server. Set to 0 to disable. */
    keepaliveInterval?: number;
    /** How many consecutive, unanswered SSH-level keepalive packets that can be sent to the server before disconnection. */
    keepaliveCountMax?: number;
    /** * How long (in milliseconds) to wait for the SSH handshake to complete. */
    readyTimeout?: number;
    /** Performs a strict server vendor check before sending vendor-specific requests. */
    strictVendor?: boolean;
    /** Set to `true` to use OpenSSH agent forwarding (`auth-agent@openssh.com`) for the life of the connection. */
    agentForward?: boolean;
    /** IP address of the network interface to use to connect to the server. Default: (none -- determined by OS) */
    localAddress?: string;
    /** The local port number to connect from. Default: (none -- determined by OS) */
    localPort?: number;
    /** The underlying socket timeout in ms. Default: none) */
    timeout?: number;
    /** A custom server software name/version identifier. Default: 'ssh2js' + moduleVersion + 'srv' */
    ident?: Buffer | string;
    /** The path on the remote server where files will be uploaded. */
    sftpPath?: string;
}
