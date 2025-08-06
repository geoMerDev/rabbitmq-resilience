
# rabbitmq-resilience

`rabbitmq-resilience` is a library designed to provide resilience and reliability for RabbitMQ message handling in Node.js applications.

## Installation

To install the package, use npm:

```bash
npm install rabbitmq-resilience
```

## Configuration

To configure the `RabbitMQResilience` instance, you need to provide a configuration object that adheres to the `RabbitMQResilienceConfig` interface. Here is an example configuration:

```typescript
import { Sequelize } from "sequelize";
import { Options } from "amqplib";
import { RabbitMQResilienceConfig } from "@/domain/interfaces/rabbitMQResilienceConfig";
import { EventResilienceHandlerConfig } from "@/domain/interfaces/eventResilienceHandlerConfig";
import { EventProcessConfig } from "@/domain/interfaces/eventProcessConfig";

export const rabbitMQResilienceConfig: RabbitMQResilienceConfig = {
    rabbitMQConfigConnect: {
        protocol: process.env.RABBIT_PROTOCOL ?? 'amqp',
        hostname: process.env.RABBIT_HOSTNAME ?? 'localhost',
        port: Number(process.env.RABBIT_PORT) ?? 5672,
        username: process.env.RABBIT_USERNAME ?? 'guest',
        password: process.env.RABBIT_PASSWORD ?? 'guest',
        vhost: process.env.RABBIT_VHOST ?? '/',
    } as Options.Connect,
    queue: process.env.RABBIT_QUEUE ?? 'geomerdev.subdomain-name',
    routingKey: process.env.RABBIT_ROUTING_KEY ?? 'geomerdev',
    exchange: process.env.RABBIT_EXCHANGE ?? 'geomerdev',
    typeExchange: process.env.RABBIT_TYPE_EXCHANGE ?? 'fanout',
    prefetch: Number(process.env.RABBIT_PREFETCH) ?? 1,
    directExchange: process.env.RABBIT_DIRECT_EXCHANGE ?? 'geomerdev-direct',
    typeDirectExchange: process.env.RABBIT_TYPE_DIRECT_EXCHANGE ?? 'direct',
    retryQueue: process.env.RABBIT_RETRY_QUEUE ?? 'geomerdev.subdomain-name.events-retry',
    retryRoutingKey: process.env.RABBIT_RETRY_ROUTING_KEY ?? 'geomerdev.subdomain-name.events-retry',
    retryEndpoint: process.env.RABBIT_RETRY_ENDPOINT ?? 'geomerdev.service',
    deadLetterQueue: process.env.RABBIT_DEAD_LETTER_QUEUE ?? 'geomerdev.dead-letter',
    deadLetterRoutingKey: process.env.RABBIT_DEAD_LETTER_ROUTING_KEY ?? 'geomerdev.dead-letter',
    messageTTL: Number(process.env.RABBIT_MESSAGE_TTL) ?? 10000,
    eventResilienceHandlerConfig: {
        immediateRetryAttempts: Number(process.env.IMMEDIATE_RETRY_ATTEMPTS) ?? 5,
        delayedRetryAttempts: Number(process.env.DELAYED_RETRY_ATTEMPTS) ?? 3,
        delayInMs: Number(process.env.DELAY_IN_MS) ?? 1000,
    } as EventResilienceHandlerConfig,
    eventsToProcess: [] as EventProcessConfig[], // Add your event process configurations here
    sequelizeConnection: new Sequelize({
        dialect: 'mysql',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT) ?? 3306,
        username: process.env.DB_USERNAME ?? 'user',
        password: process.env.DB_PASSWORD ?? 'password',
        database: process.env.DB_NAME ?? 'database',
    }),
    sequelizeOptions: { // If sequelizeConnection as null this is required
        dialect: 'mysql',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT) ?? 3306,
        username: process.env.DB_USERNAME ?? 'user',
        password: process.env.DB_PASSWORD ?? 'password',
        database: process.env.DB_NAME ?? 'database',
    }
};
```
## Configuring `eventsToProcess`

To configure the events to be processed, you need to provide an array of `EventProcessConfig` objects. Each object specifies the event type and the processes to be executed for that event. Here is an example configuration:

```typescript
import { EventProcessConfig, RabbitMQMessageDto } from 'rabbitmq-resilience';
import { Process } from "@/infrastructure/rabbitmqResilience/process";

export const eventsToProcess: EventProcessConfig[] = [
    {
        eventType: 'domain.sub-domain.event',
        processes: [
            {
                processFunction: async (event: RabbitMQMessageDto) => Process.success(JSON.parse(event.content.toString())),
                processName: 'process-success'
            }
        ]
    },
    {
        eventType: 'domain.sub-domain.event.fail',
        processes: [
            {
                processFunction: async (event: RabbitMQMessageDto) => Process.fail(JSON.parse(event.content.toString())),
                processName: 'process-fail'
            }
        ]
    },
    {
        eventType: 'domain.sub-domain.event.failCustomException',
        processes: [
            {
                processFunction: async (event: RabbitMQMessageDto) => Process.failCustomException(JSON.parse(event.content.toString())),
                processName: 'process-fail-custom-exception'
            }
        ]
    },
    {
        eventType: 'domain.sub-domain.event.random',
        processes: [
            {
                processFunction: async (event: RabbitMQMessageDto) => Process.random(JSON.parse(event.content.toString())),
                processName: 'process-random'
            }
        ]
    },
    {
        eventType: 'domain.sub-domain.event.multiple',
        processes: [
            {
                processFunction: async (event: RabbitMQMessageDto) => Process.success(JSON.parse(event.content.toString())),
                processName: 'process-success'
            },
            {
                processFunction: async (event: RabbitMQMessageDto) => Process.fail(JSON.parse(event.content.toString())),
                processName: 'process-fail'
            },
            {
                processFunction: async (event: RabbitMQMessageDto) => Process.failCustomException(JSON.parse(event.content.toString())),
                processName: 'process-fail-custom-exception'
            },
            {
                processFunction: async (event: RabbitMQMessageDto) => Process.random(JSON.parse(event.content.toString())),
                processName: 'process-random'
            }
        ]
    }
];
```

This configuration specifies different event types and their corresponding processes. Each process includes a function to handle the event and a name for the process.
## Example Environment Variables

Here are some example environment variables you can set for the configuration:

```bash
RABBIT_USERNAME=guest
RABBIT_PASSWORD=guest
RABBIT_PROTOCOL=amqp
RABBIT_HOSTNAME=localhost
RABBIT_PORT=5672
RABBIT_VHOST=/
RABBIT_QUEUE=geomerdev.subdomain-name
RABBIT_ROUTING_KEY=geomerdev
RABBIT_EXCHANGE=geomerdev
RABBIT_DIRECT_EXCHANGE=geomerdev-direct
RABBIT_TYPE_EXCHANGE=fanout
RABBIT_TYPE_DIRECT_EXCHANGE=direct
RABBIT_PREFETCH=1
RABBIT_RETRY_QUEUE=geomerdev.subdomain-name.events-retry
RABBIT_RETRY_ROUTING_KEY=geomerdev.subdomain-name.events-retry
RABBIT_RETRY_ENDPOINT=geomerdev.service
RABBIT_MESSAGE_TTL=10000
RABBIT_DEAD_LETTER_QUEUE=geomerdev.dead-letter
RABBIT_DEAD_LETTER_ROUTING_KEY=geomerdev.dead-letter
IMMEDIATE_RETRY_ATTEMPTS=5
DELAYED_RETRY_ATTEMPTS=3
DELAY_IN_MS=1000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=user
DB_PASSWORD=password
DB_NAME=database
```
### Configuring Routes and Socket Manager

To configure the routes for the `RabbitMQResilience` library, you need to set up the routes in your application. Here is an example of how to do it:

```typescript
import { Hono } from 'hono';
import { RabbitMQResilienceRoutes ,RabbitMQResilienceSocketManager} from 'rabbitmq-resilience';

class App {
    private app: Hono;
    private port: number;

    constructor(options: { port?: number }) {
        const { port = 3000 } = options;
        this.app = new Hono();
        this.port = port;
    }

    public async start() {
        // Set up routes of library
        this.app.route('/', new RabbitMQResilienceRoutes().routes);

        const server = serve({
            fetch: this.app.fetch,
            port: this.port
        }, (info) => {
            console.log(`Server running on port ${info.port}`);
        });

        // Initialize socket manager of library
        RabbitMQResilienceSocketManager.initialize(server, '/websocket/');
    }
}
```

## Usage

### Initialization

First, initialize the `RabbitMQResilience` instance with the necessary configuration:

```typescript
import { RabbitMQResilience } from 'rabbitmq-resilience';
import { rabbitMQResilienceConfig } from '@/infrastructure/rabbitmqResilience/rabbitMQResilienceConfig';

export const RabbitMQR = RabbitMQResilience.initialize(rabbitMQResilienceConfig);
```

### Publishing Events

You can publish events to the default exchange or a custom exchange:

```typescript
import { RabbitMQMessageDto } from 'rabbitmq-resilience';

// Create a message
const message = new RabbitMQMessageDto(
  Buffer.from('Your message content'),
  { /* message fields */ },
  { /* message properties */ }
);

// Publish to the default exchange
await RabbitMQR.publishEvent(message);

// Publish to a custom exchange
await RabbitMQR.publishEventCustomExchange(message, 'custom-exchange', 'routing-key');
```

### Republishing and Reprocessing Events

You can republish or reprocess events using their UUID:

```typescript
// Republishing an event
await RabbitMQR.republishEvent('event-uuid');

// Reprocessing an event
await RabbitMQR.reprocessEvent('event-uuid', 'process-name');
```

### Control your logs

You can decide what logs want to see and wich one no. 
Find it at the config file like this. If set it as off all are on by default

```
    {
        ...
        showLogs: {
            log?:boolean,
            error?:boolean,
            warn?:boolean,
            info?:boolean,
            debug?:boolean,
            trace?:boolean,
            time?:boolean,
            timeEnd?:boolean
        },
        ...
    }
```

### Configuration of smtp
This smtp is for failed events the ones that goes to dead letter.
This configuration is obligatory
````
    {
        ...
        emailConfig:{
            APP_NAME:string,
            EMAIL:string,
            EMAIL_AUTH_USER:string,
            EMAIL_AUTH_PASS:string,
            EMAIL_HOST:string,
            EMAIL_PORT:number
        },
        ...
    }
````

### Table rotations
This section is made so the tables of rabbitmq-resilence dont overlap with information. For this to work you have to enable first. If the sftp server is not enable then the migration will be save at local server.Follow up this configurations.

```
    {
        ...
            rotationTables:{
                enable: boolean;
                typeOfRotation: 'max-records' | 'size-table' | 'time-rotation';
                sftpServer?: SftpConnectOptions;
                maxRecords?: number;
                maxSizeMB?: number;
                maxAgeDays?: number;
            }
        ...
    }
```



## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

Created by [geomerdev](https://geomerdev.com).