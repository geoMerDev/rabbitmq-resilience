import {OutboxEventDto, RabbitMQMessageDto} from "@/domain/dtos/eventManager";
import {OutboxEventEntity} from "@/domain/entities/eventManager";
import {PaginationDto} from "@/domain/dtos/shared/pagination.dto";
import {OutboxEventPaginatedEntity} from "@/domain/entities/eventManager/outboxEventPaginated.entity";
import {DeliveryInfo} from "@/domain/interfaces/outboxEvent";

export abstract class OutboxEventDatasource {
    abstract register(outboxEventDto: OutboxEventDto): Promise<OutboxEventEntity>;

    abstract getByUuid(uuid: string): Promise<OutboxEventEntity | null>;

    abstract getPaginated(paginationDto: PaginationDto): Promise<OutboxEventPaginatedEntity>;

    abstract registerFromRabbitMQMessageDto(rabbitMQMessageDto: RabbitMQMessageDto, deliveryInfo: DeliveryInfo| null): Promise<OutboxEventEntity>;


}