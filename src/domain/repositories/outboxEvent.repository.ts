import {PaginationDto} from "@/domain/dtos/shared/pagination.dto";
import {OutboxEventPaginatedEntity} from "@/domain/entities/eventManager/outboxEventPaginated.entity";

export abstract class OutboxEventRepository {
    abstract getPagineated(paginationDto: PaginationDto): Promise<OutboxEventPaginatedEntity>;
}