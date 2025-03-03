import {OutboxEventDatasourceImpl} from "@/infrastructure/datasources/eventManager";
import {PaginationDto} from "@/domain/dtos/shared/pagination.dto";
import {OutboxEventPaginatedEntity} from "@/domain/entities/eventManager/outboxEventPaginated.entity";

export class OutboxEventRepositoryImpl {
    private readonly outboxEventDatasource: OutboxEventDatasourceImpl

    constructor(
        outboxEventDatasource: OutboxEventDatasourceImpl
    ) {
        this.outboxEventDatasource = outboxEventDatasource;
    }

    async getPaginated(paginationDto: PaginationDto): Promise<OutboxEventPaginatedEntity> {
        return await this.outboxEventDatasource.getPaginated(paginationDto);
    }


}