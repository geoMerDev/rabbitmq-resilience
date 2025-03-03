import {OutboxEventDatasource} from "@/domain/datasources/eventManager";
import {OutboxEventDto, RabbitMQMessageDto} from "@/domain/dtos/eventManager";
import {OutboxEventEntity} from "@/domain/entities/eventManager";
import {OutboxEventSequelize} from "@/infrastructure/database/models/eventManager/OutboxEvent";
import {PaginationDto} from "@/domain/dtos/shared/pagination.dto";
import {OutboxEventPaginatedEntity} from "@/domain/entities/eventManager/outboxEventPaginated.entity";
import {Op, Order, WhereOptions} from "sequelize";
import {DeliveryInfo} from "@/domain/interfaces/outboxEvent";


export class OutboxEventDatasourceImpl implements OutboxEventDatasource {
    private validSortingKeys = ['id', 'type', 'createdAt', 'updatedAt']; // Add valid sorting keys here

    private mapToEntity(outboxEvent: OutboxEventSequelize): OutboxEventEntity {
        return new OutboxEventEntity(
            outboxEvent.id,
            outboxEvent.uuid,
            outboxEvent.type,
            outboxEvent.headers,
            outboxEvent.properties,
            outboxEvent.payload,
            outboxEvent.deliveryInfo,
            outboxEvent.attempts,
            outboxEvent.createdAt,
            outboxEvent.updatedAt,
            outboxEvent.deletedAt
        );
    }

    async register(outboxEventDto: OutboxEventDto): Promise<OutboxEventEntity> {
        const existingEvent = await OutboxEventSequelize.findOne({where: {uuid: outboxEventDto.uuid}});

        if (existingEvent) {
            await existingEvent.update({
                type: outboxEventDto.type,
                headers: outboxEventDto.headers,
                properties: outboxEventDto.properties,
                payload: outboxEventDto.payload,
                deliveryInfo: outboxEventDto.deliveryInfo,
                attempts: existingEvent.attempts + 1
            });
            return this.mapToEntity(existingEvent);
        } else {
            const outboxEvent = await OutboxEventSequelize.create({
                uuid: outboxEventDto.uuid,
                type: outboxEventDto.type,
                headers: outboxEventDto.headers,
                properties: outboxEventDto.properties,
                payload: outboxEventDto.payload,
                deliveryInfo: outboxEventDto.deliveryInfo,
                attempts: outboxEventDto.attempts
            });
            return this.mapToEntity(outboxEvent);
        }
    }

    async getByUuid(uuid: string): Promise<OutboxEventEntity | null> {
        const outboxEvent = await OutboxEventSequelize.findOne({where: {uuid}});
        if (!outboxEvent) {
            return null;
        }
        return this.mapToEntity(outboxEvent);
    }


    async getPaginated(paginationDto: PaginationDto): Promise<OutboxEventPaginatedEntity> {
        try {
            const {limit, offset} = paginationDto.getPaginationParams();
            const order: Order = paginationDto.sorting && this.validSortingKeys.includes(paginationDto.sorting.key) ? [[paginationDto.sorting.key, paginationDto.sorting.order]] : [];
            let where: WhereOptions = {}
            const search = paginationDto.search?.trim();
            if (search) {
                where = {
                    [Op.or]: [
                        {uuid: {[Op.like]: `%${search}%`}},
                        {type: {[Op.like]: `%${search}%`}},
                    ]
                }
            }

            const outboxEvents = await OutboxEventSequelize.findAndCountAll({
                limit: limit,
                offset: offset,
                order: order,
                where: where
            });
            return new OutboxEventPaginatedEntity(outboxEvents.count, outboxEvents.rows.map(outboxEvent => this.mapToEntity(outboxEvent)));
        } catch (error) {
            console.error(`Error fetching paginated outbox events:`, error);
            throw error;
        }
    }

    async registerFromRabbitMQMessageDto(rabbitMQMessageDto: RabbitMQMessageDto, deliveryInfo: DeliveryInfo | null): Promise<OutboxEventEntity> {
        //trasform RabbitMQMessageDto to OutboxEventDto
        const [errors, outboxEventDto] = OutboxEventDto.create({
            uuid: rabbitMQMessageDto.properties.messageId,
            type: rabbitMQMessageDto.properties.type,
            headers: rabbitMQMessageDto.properties.headers,
            properties: rabbitMQMessageDto.properties,
            payload: JSON.parse(rabbitMQMessageDto.content.toString()),
            deliveryInfo: deliveryInfo,
            attempts: 0
        })
        if (errors.length > 0) {
            throw new Error(`Error creating OutboxEventDto: ${errors.join(',')}`);
        }
        return this.register(outboxEventDto!);
    }


}
