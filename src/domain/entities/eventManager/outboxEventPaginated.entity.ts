import {OutboxEventEntity} from "@/domain/entities/eventManager/outboxEvent.entity";

export class OutboxEventPaginatedEntity {
    constructor(
        public totalItems: number,
        public outboxEvents: OutboxEventEntity[]
    ) {
    }
}