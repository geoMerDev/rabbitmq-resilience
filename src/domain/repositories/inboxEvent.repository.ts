import {PaginationDto} from "@/domain/dtos/shared/pagination.dto";
import {InboxEventPaginatedEntity} from "@/domain/entities/eventManager/inboxEventPaginated.entity";
import {InboxEventAndProcessEntity} from "@/domain/entities/eventManager/inboxEventAndProcess.entity";

export abstract class InboxEventRepository {
    abstract getPaginated(paginationDto: PaginationDto): Promise<InboxEventPaginatedEntity>;

    abstract getByUuid(uuid: string): Promise<InboxEventAndProcessEntity>;
}