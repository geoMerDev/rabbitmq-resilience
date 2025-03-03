import {Context} from "hono";
import {RabbitMQ} from "@/infrastructure/eventManager/rabbitmq";
import {RabbitMQInfo} from "@/domain/entities/eventManager/rabbitMQInfo.entity";

export class EventManagerController {

    public async getRabbitMQInfo(ctx: Context) {
        try {
            const connectionStatus = RabbitMQ.isConnected() ? "Connected" : "Not Connected";
            const host = RabbitMQ.getHost();
            const virtualHost = RabbitMQ.getVirtualHost();
            const mainQueueName = RabbitMQ.mainQueue();
            const mainQueueStatus = await RabbitMQ.mainQueueStatus();
            const retryQueueStatus = await RabbitMQ.retryQueueStatus()
            const deadLetterQueueStatus = await RabbitMQ.deadLetterQueueStatus();
            const prefetch = RabbitMQ.getPrefetch();

            const info: RabbitMQInfo = new RabbitMQInfo(
                connectionStatus,
                host,
                virtualHost,
                mainQueueName,
                mainQueueStatus,
                retryQueueStatus,
                deadLetterQueueStatus,
                prefetch
            );

            return ctx.json(info);
        } catch (error) {
            console.error(error);
            ctx.status(500);
            return ctx.json({error});
        }
    }
}