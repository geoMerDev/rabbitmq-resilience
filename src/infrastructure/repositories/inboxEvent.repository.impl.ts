import {InboxEventRepository} from "@/domain/repositories/inboxEvent.repository";
import {InboxEventDatasourceImpl} from "@/infrastructure/datasources/eventManager";
import {PaginationDto} from "@/domain/dtos/shared/pagination.dto";
import {InboxEventPaginatedEntity} from "@/domain/entities/eventManager/inboxEventPaginated.entity";
import {InboxEventAndProcessEntity} from "@/domain/entities/eventManager/inboxEventAndProcess.entity";

export class InboxEventRepositoryImpl implements InboxEventRepository {
    private readonly inboxEventDatasource: InboxEventDatasourceImpl

    constructor(
        inboxEventDatasource: InboxEventDatasourceImpl
    ) {
        this.inboxEventDatasource = inboxEventDatasource;
    }

    async getPaginated(paginationDto: PaginationDto): Promise<InboxEventPaginatedEntity> {
        return await this.inboxEventDatasource.getPaginated(paginationDto);
    }

    async getByUuid(uuid: string): Promise<InboxEventAndProcessEntity> {
        return await this.inboxEventDatasource.getByUuidWhitProcess(uuid);
    }
}