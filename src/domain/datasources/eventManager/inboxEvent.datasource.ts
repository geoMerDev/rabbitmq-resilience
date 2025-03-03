import {InboxEventDto} from "@/domain/dtos/eventManager";
import {InboxEventEntity} from "@/domain/entities/eventManager";
import {PaginationDto} from "@/domain/dtos/shared/pagination.dto";
import {InboxEventPaginatedEntity} from "@/domain/entities/eventManager/inboxEventPaginated.entity";
import {InboxEventAndProcessEntity} from "@/domain/entities/eventManager/inboxEventAndProcess.entity";

export abstract class InboxEventDatasource {
    abstract createInboxEvent(inboxEventDto: InboxEventDto): Promise<InboxEventEntity>;

    abstract getByUuid(uuid: string): Promise<InboxEventEntity | null>;

    abstract countInboxEvents(): Promise<number>;

    abstract countInboxEventsByType(type: string): Promise<number>;

    abstract countInboxEventsByDateRange(startDate: Date, endDate: Date): Promise<number>;

    abstract countByType(type: string): Promise<number>;

    abstract processSuccessByUuidAndProcessName(uuid: string, processName: string): Promise<boolean>;

    abstract getPaginated(paginationDto: PaginationDto): Promise<InboxEventPaginatedEntity>;

    abstract getByUuidWhitProcess(uuid: string): Promise<InboxEventAndProcessEntity>;
}