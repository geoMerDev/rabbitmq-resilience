export class RabbitMQMessageDto {
    constructor(
        public content: Buffer,
        public fields: MessageFieldsDto,
        public properties: MessagePropertiesDto
    ) {
    }

    static create(object: { [key: string]: any }): [string[], RabbitMQMessageDto?] {
        const {content, fields, properties} = object;
        const errors: string[] = [];

        if (!Buffer.isBuffer(content)) errors.push('Invalid content');
        if (typeof fields !== 'object' || fields === null) errors.push('Invalid fields');
        if (typeof properties !== 'object' || properties === null) errors.push('Invalid properties');

        const [fieldsErrors, fieldsDto] = MessageFieldsDto.create(fields);
        const [propertiesErrors, propertiesDto] = MessagePropertiesDto.create(properties);

        errors.push(...fieldsErrors, ...propertiesErrors);

        if (errors.length > 0) return [errors];

        return [[], new RabbitMQMessageDto(content, fieldsDto!, propertiesDto!)];
    }
}

export class MessageFieldsDto {
    constructor(
        public deliveryTag: number,
        public redelivered: boolean,
        public exchange: string,
        public routingKey: string,
        public messageCount?: number,
        public consumerTag?: string
    ) {
    }

    static create(object: { [key: string]: any }): [string[], MessageFieldsDto?] {
        const {delivery_tag, redelivered, exchange, routing_key, message_count, consumer_tag} = object;
        const errors: string[] = [];
        if (delivery_tag !== undefined && typeof delivery_tag !== 'number') errors.push('Invalid deliveryTag');
        if (redelivered !== undefined && typeof redelivered !== 'boolean') errors.push('Invalid redelivered');
        if (exchange !== undefined && typeof exchange !== 'string') errors.push('Invalid exchange');
        if (routing_key !== undefined && typeof routing_key !== 'string') errors.push('Invalid routingKey');

        if (errors.length > 0) return [errors];

        return [[], new MessageFieldsDto(delivery_tag, redelivered, exchange, routing_key, message_count, consumer_tag)];
    }
}

export class MessagePropertiesDto {
    constructor(
        public contentType: any | undefined,
        public contentEncoding: any | undefined,
        public headers: MessagePropertyHeadersDto | undefined,
        public deliveryMode: any | undefined,
        public priority: any | undefined,
        public correlationId: any | undefined,
        public replyTo: any | undefined,
        public expiration: any | undefined,
        public timestamp: any | undefined,
        public messageId: any | undefined,
        public type: any | undefined,
        public userId: any | undefined,
        public appId: any | undefined,
        public clusterId: any | undefined
    ) {
    }

    static create(object: { [key: string]: any }): [string[], MessagePropertiesDto?] {
        const {
            contentType, contentEncoding, headers, deliveryMode, priority, correlationId, replyTo,
            expiration, timestamp, messageId, type, userId, appId, clusterId
        } = object;
        const errors: string[] = [];
        // Validate properties
        const [propertiesErrors] = this.validateProperties({type, messageId});
        if (propertiesErrors.length > 0) errors.push(...propertiesErrors);
        if (errors.length > 0) return [errors];
        return [[], new MessagePropertiesDto(
            contentType, contentEncoding, headers, deliveryMode, priority, correlationId, replyTo,
            expiration, timestamp, messageId, type, userId, appId, clusterId
        )];
    }

    private static validateProperties(properties: { [key: string]: any }): [string[]] {
        // Validate appId, type, contentType, messageId
        const errors: string[] = [];
        const {type, messageId} = properties;

        if (type === undefined || typeof type !== 'string') errors.push('Invalid or missing type');
        if (messageId === undefined || typeof messageId !== 'string') errors.push('Invalid or missing messageId');

        return [errors];
    }
}


export interface MessagePropertyHeadersDto {
    [key: string]: any;
}
