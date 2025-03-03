import {InboxEventEntity} from "@/domain/entities/eventManager/inboxEvent.entity";

export class InboxEventPaginatedEntity {
    constructor(
        public totalItems: number,
        public inboxEvents: InboxEventEntity[]
    )
    {}

}