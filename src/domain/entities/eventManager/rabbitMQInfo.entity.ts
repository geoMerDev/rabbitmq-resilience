export interface QueueStatus {
    queue: string;
    messageCount: number;
    consumerCount: number;
}
export class RabbitMQInfo {
    constructor(
        public connectionStatus: string,
        public host: string,
        public virtualHost: string,
        public mainQueueName: string,
        public mainQueueStatus: QueueStatus,
        public retryQueueStatus: QueueStatus,
        public deadLetterQueueStatus: QueueStatus,
        public prefetch: number
    ) {}
}